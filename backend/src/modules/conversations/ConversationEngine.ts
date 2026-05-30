import CustomerState from '../../models/CustomerState';
import Organization from '../../models/Organization';
import Menu from '../../models/Menu';
import AutoReplyRule from '../../models/AutoReplyRule';
import Template from '../../models/Template';
import AnalyticsLog from '../../models/AnalyticsLog';
import { enqueueMessage } from '../../services/queue/MessageQueue';
import { GeminiFallback } from '../ai/GeminiFallback';

export class ConversationEngine {
  static async processIncoming(orgIdOrSlug: string, sessionId: string, phoneNumber: string, messageBody: string) {
    const text = messageBody.trim().toLowerCase();
    console.log(`MESSAGE_RECEIVED: ${messageBody}`);
    
    // Resolve Organization
    let org = await Organization.findOne({ slug: orgIdOrSlug }) || await Organization.findById(orgIdOrSlug);
    if (!org) {
      console.log('FLOW_NOT_FOUND: Organization not found');
      return;
    }

    const orgId = org._id.toString();
    console.log(`ORGANIZATION_FOUND: ${orgId}`);

    // Get or create customer state
    let state = await CustomerState.findOne({ organizationId: orgId, phoneNumber, sessionId });
    let isNewSession = false;
    if (!state) {
      state = new CustomerState({ organizationId: orgId, phoneNumber, sessionId, conversationState: 'MAIN_MENU' });
      isNewSession = true;
      await this.logAnalytics(orgId, phoneNumber, sessionId, 'NEW_CONVERSATION');
    }

    console.log('FLOW_SEARCH_STARTED');

    // 1. Check Auto-Reply Rules first (Global override like "help", "pricing")
    const ruleMatch = await this.checkAutoReplyRules(orgId, text);
    if (ruleMatch) {
      await this.logAnalytics(orgId, phoneNumber, sessionId, 'KEYWORD_MATCH', { keyword: ruleMatch.keyword, ruleId: ruleMatch._id });
      return this.executeRule(ruleMatch, state);
    }

    // 2. Handle EXIT explicitly
    if (text === '0' || text === 'exit') {
      state.conversationState = 'EXIT';
      await state.save();
      console.log('STATE_UPDATED');
      return enqueueMessage(sessionId, phoneNumber, '✅ Session closed. Have a great day!\n\n_Type "hi" to start again._').then(() => console.log('MESSAGE_SENT'));
    }

    // 3. Handle Boot/Reset explicitly
    if (['hi', 'hello', 'demo', 'project'].includes(text)) {
      state.conversationState = 'MAIN_MENU';
      await state.save();
      console.log('STATE_UPDATED');
      return this.sendMenu(state, null, orgId, true);
    }

    // 4. Any-Message Activation
    if (isNewSession) {
      return this.sendMenu(state, null, orgId, true);
    }

    // 5. Process Based on Current State
    switch (state.conversationState) {
      case 'MAIN_MENU':
      case 'SERVICES_MENU':
      case 'REPORT_MENU':
      case 'DOCS_MENU':
      case 'CONTACT_MENU':
        await this.handleMenuState(state, text, orgId);
        break;
      
      case 'AI_MODE':
        await this.handleAIMode(state, text, orgId);
        break;

      case 'RECOVERY_MODE':
        await this.handleRecoveryMode(state, text, orgId);
        break;

      case 'EXIT':
      case 'COMPLETED':
      case 'IDLE':
      case 'EXPIRED':
        // Re-awaken session
        state.conversationState = 'MAIN_MENU';
        await state.save();
        await this.sendMenu(state, null, orgId, true);
        break;
        
      default:
        state.conversationState = 'MAIN_MENU';
        await state.save();
        await this.sendMenu(state, null, orgId, true);
        break;
    }
  }

  private static async checkAutoReplyRules(orgId: string, text: string) {
    const rules = await AutoReplyRule.find({ organizationId: orgId, active: true });
    return rules.find(rule => 
      rule.matchType === 'EXACT' ? rule.keyword.toLowerCase() === text : text.includes(rule.keyword.toLowerCase())
    );
  }

  private static async executeRule(rule: any, state: any) {
    if (rule.replyType === 'TEXT') {
      return enqueueMessage(state.sessionId, state.phoneNumber, rule.replyContent);
    }
    // Implement MEDIA, TEMPLATE overrides later
    return enqueueMessage(state.sessionId, state.phoneNumber, 'Rule matched but handler not implemented.');
  }

  private static async handleMenuState(state: any, text: string, orgId: string) {
    // If active menu exists, try to select option
    if (state.activeMenuId) {
      const activeMenu = await Menu.findById(state.activeMenuId);
      if (activeMenu) {
        const option = activeMenu.options.find((opt: any) => 
          opt.keyword.toLowerCase() === text || text === opt.label.toLowerCase()
        );
        
        if (option) {
          await this.logAnalytics(orgId, state.phoneNumber, state.sessionId, 'MENU_USAGE', { menuId: activeMenu._id, keyword: option.keyword });
          return this.executeMenuOption(state, option, orgId);
        }
      }
    }
    
    // If no option matched, trigger AI fallback OR send default menu error
    return this.fallback(state, text, orgId);
  }

  private static async executeMenuOption(state: any, option: any, orgId: string) {
    if (option.action === 'NEXT_MENU' && option.targetId) {
      const nextMenu = await Menu.findById(option.targetId);
      if (nextMenu) {
        state.activeMenuId = nextMenu._id;
        // Optionally update state based on menu title
        if (nextMenu.title.toLowerCase().includes('services')) state.conversationState = 'SERVICES_MENU';
        else if (nextMenu.title.toLowerCase().includes('report')) state.conversationState = 'REPORT_MENU';
        else if (nextMenu.title.toLowerCase().includes('docs')) state.conversationState = 'DOCS_MENU';
        else if (nextMenu.title.toLowerCase().includes('contact')) state.conversationState = 'CONTACT_MENU';
        
        await state.save();
        return this.sendMenu(state, nextMenu, orgId);
      }
    } else if (option.action === 'SEND_TEMPLATE' && option.targetId) {
       const template = await Template.findById(option.targetId);
       if (template) {
         return enqueueMessage(state.sessionId, state.phoneNumber, template.content); // We will add variable parsing later
       }
    }
  }

  private static async sendMenu(state: any, menu: any, orgId: string, isRoot: boolean = false) {
    let targetMenu = menu;
    if (!targetMenu && isRoot) {
      targetMenu = await Menu.findOne({ organizationId: orgId, isRoot: true, active: true });
    }

    if (!targetMenu) {
       console.log('FLOW_NOT_FOUND');
       return enqueueMessage(state.sessionId, state.phoneNumber, 'Menu is currently unavailable.');
    }

    console.log(`FLOW_FOUND: ${targetMenu.title}`);
    
    state.activeMenuId = targetMenu._id;
    await state.save();
    console.log('STATE_UPDATED');

    let text = `${targetMenu.title}\n\n${targetMenu.content}\n\n`;
    targetMenu.options.forEach((opt: any) => {
      text += `${opt.keyword}. ${opt.label}\n`;
    });
    
    await enqueueMessage(state.sessionId, state.phoneNumber, text);
    console.log('MESSAGE_SENT');
  }

  private static async fallback(state: any, text: string, orgId: string) {
    await this.logAnalytics(orgId, state.phoneNumber, state.sessionId, 'FAILED_INPUT', { input: text });
    const aiResponse = await GeminiFallback.generateReply(text, orgId);
    if (aiResponse) {
       return enqueueMessage(state.sessionId, state.phoneNumber, aiResponse);
    }
    
    // Recovery Mode
    state.conversationState = 'RECOVERY_MODE';
    await state.save();
    
    const recoveryText = `❌ I didn't understand.\n\n1️⃣ Main Menu\n2️⃣ Continue Previous Conversation\n3️⃣ Exit\n\n💬 Reply with a number.`;
    return enqueueMessage(state.sessionId, state.phoneNumber, recoveryText);
  }

  private static async handleRecoveryMode(state: any, text: string, orgId: string) {
    if (text === '1') {
      state.conversationState = 'MAIN_MENU';
      await state.save();
      return this.sendMenu(state, null, orgId, true);
    } else if (text === '2') {
      state.conversationState = 'ACTIVE';
      await state.save();
      if (state.activeMenuId) {
        const menu = await Menu.findById(state.activeMenuId);
        return this.sendMenu(state, menu, orgId);
      } else {
        return this.sendMenu(state, null, orgId, true);
      }
    } else if (text === '3') {
      state.conversationState = 'EXIT';
      await state.save();
      return enqueueMessage(state.sessionId, state.phoneNumber, '✅ Session closed.');
    } else {
      return enqueueMessage(state.sessionId, state.phoneNumber, `Please reply with 1, 2, or 3.\n\n1️⃣ Main Menu\n2️⃣ Continue\n3️⃣ Exit`);
    }
  }

  private static async handleAIMode(state: any, text: string, orgId: string) {
     const aiResponse = await GeminiFallback.generateReply(text, orgId);
     return enqueueMessage(state.sessionId, state.phoneNumber, aiResponse || 'AI is currently unavailable.');
  }

  private static async logAnalytics(
    orgId: string, 
    phoneNumber: string, 
    sessionId: string, 
    event: 'NEW_CONVERSATION' | 'MENU_USAGE' | 'FAILED_INPUT' | 'KEYWORD_MATCH', 
    metadata: any = {}
  ) {
    try {
      await AnalyticsLog.create({ organizationId: orgId, phoneNumber, sessionId, event, metadata });
    } catch (e) {
      console.error('Failed to log analytics:', e);
    }
  }
}
