import { enqueueMessage } from '../../services/queue/MessageQueue';
import { GeminiFallback } from '../ai/GeminiFallback';
import { convexClient } from '../../utils/convex';
import { api } from '../../../convex/_generated/api';

export class ConversationEngine {
  static async processIncoming(orgIdOrSlug: string, sessionId: string, phoneNumber: string, messageBody: string) {
    const text = messageBody.trim().toLowerCase();
    console.log(`MESSAGE_RECEIVED: ${messageBody}`);
    
    // Resolve Organization
    const org: any = await convexClient.query(api.chatbot.getOrganization, { slugOrId: orgIdOrSlug });
    if (!org) {
      console.log('FLOW_NOT_FOUND: Organization not found');
      return;
    }

    const orgId = org._id;
    console.log(`ORGANIZATION_FOUND: ${orgId}`);

    // Get or create customer state
    const result = await convexClient.mutation(api.chatbot.getCustomerState, {
      organizationId: orgId,
      phoneNumber,
      sessionId
    });
    const state = result.state;
    const isNewSession = result.isNewSession;
    if (!state) return;

    if (isNewSession) {
      await this.logAnalytics(orgId, phoneNumber, sessionId, 'NEW_CONVERSATION');
    }

    console.log('FLOW_SEARCH_STARTED');

    // 1. Check Auto-Reply Rules first (Global override like "help", "pricing")
    const ruleMatch = await this.checkAutoReplyRules(orgId, text);
    if (ruleMatch) {
      await this.logAnalytics(orgId, phoneNumber, sessionId, 'KEYWORD_MATCH', { keyword: ruleMatch.trigger, ruleId: ruleMatch._id });
      return this.executeRule(ruleMatch, state);
    }

    // 2. Handle EXIT explicitly
    if (text === '0' || text === 'exit') {
      await this.updateState(state._id, 'EXIT');
      console.log('STATE_UPDATED');
      return enqueueMessage(sessionId, phoneNumber, '✅ Session closed. Have a great day!\n\n_Type "hi" to start again._').then(() => console.log('MESSAGE_SENT'));
    }

    // 3. Handle Boot/Reset explicitly
    if (['hi', 'hello', 'demo', 'project'].includes(text)) {
      await this.updateState(state._id, 'MAIN_MENU');
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
        await this.updateState(state._id, 'MAIN_MENU');
        await this.sendMenu(state, null, orgId, true);
        break;
        
      default:
        await this.updateState(state._id, 'MAIN_MENU');
        await this.sendMenu(state, null, orgId, true);
        break;
    }
  }

  private static async updateState(stateId: any, conversationState: string, activeMenuId?: any) {
     await convexClient.mutation(api.chatbot.updateCustomerState, {
       stateId, conversationState, activeMenuId
     });
  }

  private static async checkAutoReplyRules(orgId: any, text: string) {
    return await convexClient.query(api.chatbot.checkAutoReplyRules, { organizationId: orgId, text });
  }

  private static async executeRule(rule: any, state: any) {
    if (rule.type === 'TEXT') {
      return enqueueMessage(state.sessionId, state.phoneNumber, rule.response);
    } else if (rule.type === 'TEMPLATE') {
      const template: any = await convexClient.query(api.chatbot.getTemplate, { templateId: rule.response });
      if (template) {
         let content = template.content;
         content = content.replace(/\{\{1\}\}/g, 'there');

         // Extract image URL to send as Header Image
         const urlRegex = /(https?:\/\/[^\s]+\.(?:png|jpg|jpeg|gif)|https:\/\/github\.com\/[^\s]+\/assets\/[^\s]+)/i;
         const match = content.match(urlRegex);
         
         let mediaUrl = undefined;
         if (match) {
             mediaUrl = match[0];
             // Remove the URL and "Logo:" label from the text so it doesn't look messy in the caption
             content = content.replace(mediaUrl, '').replace(/Logo:\s*/i, '').trim();
         }

         return enqueueMessage(state.sessionId, state.phoneNumber, content, { mediaUrl, sendAsSticker: true });
      } else {
         return enqueueMessage(state.sessionId, state.phoneNumber, 'Template not found.');
      }
    }
    // Implement MEDIA, MENU overrides later
    return enqueueMessage(state.sessionId, state.phoneNumber, 'Rule matched but handler not implemented.');
  }

  private static async handleMenuState(state: any, text: string, orgId: any) {
    // If active menu exists, try to select option
    if (state.activeMenuId) {
      const activeMenu: any = await convexClient.query(api.chatbot.getMenu, { menuId: state.activeMenuId });
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

  private static async executeMenuOption(state: any, option: any, orgId: any) {
    if (option.action === 'NEXT_MENU' && option.targetId) {
      const nextMenu: any = await convexClient.query(api.chatbot.getMenu, { menuId: option.targetId });
      if (nextMenu) {
        let conversationState = state.conversationState;
        // Optionally update state based on menu title
        if (nextMenu.title.toLowerCase().includes('services')) conversationState = 'SERVICES_MENU';
        else if (nextMenu.title.toLowerCase().includes('report')) conversationState = 'REPORT_MENU';
        else if (nextMenu.title.toLowerCase().includes('docs')) conversationState = 'DOCS_MENU';
        else if (nextMenu.title.toLowerCase().includes('contact')) conversationState = 'CONTACT_MENU';
        
        await this.updateState(state._id, conversationState, nextMenu._id);
        return this.sendMenu({...state, activeMenuId: nextMenu._id, conversationState}, nextMenu, orgId);
      }
    } else if (option.action === 'SEND_TEMPLATE' && option.targetId) {
       const template: any = await convexClient.query(api.chatbot.getTemplate, { templateId: option.targetId });
       if (template) {
         let content = template.content;
         content = content.replace(/\{\{1\}\}/g, 'there');

         const urlRegex = /(https?:\/\/[^\s]+\.(?:png|jpg|jpeg|gif)|https:\/\/github\.com\/[^\s]+\/assets\/[^\s]+)/i;
         const match = content.match(urlRegex);
         
         let mediaUrl = undefined;
         if (match) {
             mediaUrl = match[0];
             content = content.replace(mediaUrl, '').replace(/Logo:\s*/i, '').trim();
         }

         return enqueueMessage(state.sessionId, state.phoneNumber, content, { mediaUrl, sendAsSticker: true });
       }
    }
  }

  private static async sendMenu(state: any, menu: any, orgId: any, isRoot: boolean = false) {
    let targetMenu = menu;
    if (!targetMenu && isRoot) {
      targetMenu = await convexClient.query(api.chatbot.getRootMenu, { organizationId: orgId });
    }

    if (!targetMenu) {
       console.log('FLOW_NOT_FOUND');
       return enqueueMessage(state.sessionId, state.phoneNumber, 'Menu is currently unavailable.');
    }

    console.log(`FLOW_FOUND: ${targetMenu.title}`);
    
    await this.updateState(state._id, state.conversationState, targetMenu._id);
    console.log('STATE_UPDATED');

    let text = `${targetMenu.title}\n\n${targetMenu.content}\n\n`;
    targetMenu.options.forEach((opt: any) => {
      text += `${opt.keyword}. ${opt.label}\n`;
    });
    
    await enqueueMessage(state.sessionId, state.phoneNumber, text);
    console.log('MESSAGE_SENT');
  }

  private static async fallback(state: any, text: string, orgId: any) {
    await this.logAnalytics(orgId, state.phoneNumber, state.sessionId, 'FAILED_INPUT', { input: text });
    const aiResponse = await GeminiFallback.generateReply(text, orgId);
    if (aiResponse) {
       return enqueueMessage(state.sessionId, state.phoneNumber, aiResponse);
    }
    
    // Recovery Mode
    await this.updateState(state._id, 'RECOVERY_MODE', state.activeMenuId);
    
    const recoveryText = `❌ I didn't understand.\n\n1️⃣ Main Menu\n2️⃣ Continue Previous Conversation\n3️⃣ Exit\n\n💬 Reply with a number.`;
    return enqueueMessage(state.sessionId, state.phoneNumber, recoveryText);
  }

  private static async handleRecoveryMode(state: any, text: string, orgId: any) {
    if (text === '1') {
      await this.updateState(state._id, 'MAIN_MENU');
      return this.sendMenu(state, null, orgId, true);
    } else if (text === '2') {
      await this.updateState(state._id, 'ACTIVE', state.activeMenuId);
      if (state.activeMenuId) {
        const menu = await convexClient.query(api.chatbot.getMenu, { menuId: state.activeMenuId });
        return this.sendMenu(state, menu, orgId);
      } else {
        return this.sendMenu(state, null, orgId, true);
      }
    } else if (text === '3') {
      await this.updateState(state._id, 'EXIT');
      return enqueueMessage(state.sessionId, state.phoneNumber, '✅ Session closed.');
    } else {
      return enqueueMessage(state.sessionId, state.phoneNumber, `Please reply with 1, 2, or 3.\n\n1️⃣ Main Menu\n2️⃣ Continue\n3️⃣ Exit`);
    }
  }

  private static async handleAIMode(state: any, text: string, orgId: any) {
     const aiResponse = await GeminiFallback.generateReply(text, orgId);
     return enqueueMessage(state.sessionId, state.phoneNumber, aiResponse || 'AI is currently unavailable.');
  }

  private static async logAnalytics(
    orgId: any, 
    phoneNumber: string, 
    sessionId: string, 
    event: string, 
    metadata: any = {}
  ) {
    try {
      await convexClient.mutation(api.chatbot.logAnalytics, {
        organizationId: orgId, phoneNumber, sessionId, event, metadata
      });
    } catch (e) {
      console.error('Failed to log analytics:', e);
    }
  }
}
