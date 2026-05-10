import FlowNode, { FlowNodeType } from '../../models/FlowNode';
import CustomerState from '../../models/CustomerState';
import Organization from '../../models/Organization';
import { enqueueMessage } from '../queue/MessageQueue';

export class ChatbotEngine {
  static async processIncoming(orgIdOrSlug: string, sessionId: string, phoneNumber: string, messageBody: string) {
    // Normalize message: trim, lowercase, collapse spaces, and STRIP WhatsApp formatting (*, _, ~)
    const text = messageBody
      .replace(/[*_~]/g, '') // Remove formatting symbols
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ');
    
    console.log(`[BOT] Normalizing input: "${messageBody}" -> "${text}"`);
    
    const exactTrigger = "hi i need klb connect demo";
    
    // 1. Resolve Organization & Settings
    let org = await Organization.findOne({ slug: orgIdOrSlug });
    if (!org && orgIdOrSlug.match(/^[0-9a-fA-F]{24}$/)) {
      org = await Organization.findById(orgIdOrSlug);
    }
    
    if (!org) {
      console.error(`❌ [BOT] Organization not found for: ${orgIdOrSlug}`);
      return;
    }
    console.log(`[BOT] Found Org: ${org.name} (${org._id})`);

    const orgId = org._id.toString();
    const timeoutMinutes = org.settings?.conversationTimeoutMinutes || 5;

    // 2. Get or create customer state
    let state = await CustomerState.findOne({ organizationId: orgId, phoneNumber, sessionId });
    if (!state) {
      state = new CustomerState({ organizationId: orgId, phoneNumber, sessionId, conversationState: 'ACTIVE' });
    }

    // 3. CHECK FOR TIMEOUT
    const lastInteraction = state.lastInteractionAt || new Date(0);
    const diffMinutes = (Date.now() - lastInteraction.getTime()) / (1000 * 60);
    
    const isTimeout = diffMinutes > timeoutMinutes;
    const isResetTrigger = text === exactTrigger;
    const isExitTrigger = text === '0';

    console.log(`[BOT] State check - Timeout: ${isTimeout}, Reset: ${isResetTrigger}, Exit: ${isExitTrigger}`);

    // 4. Handle Root Reset Triggers (If timed out, ONLY allow the exact trigger)
    if (isResetTrigger) {
      const rootFlow = await FlowNode.findOne({ organizationId: orgId, isRoot: true });
      if (rootFlow) {
        state.previousFlowId = state.currentFlowId;
        return this.executeFlow(state, rootFlow);
      }
    }

    // 4c. If session timed out and it's NOT the trigger, stay silent
    if (isTimeout) {
      return; 
    }

    // 4b. Handle Exit Trigger
    if (isExitTrigger) {
      state.conversationState = 'COMPLETED';
      state.currentFlowId = undefined;
      await state.save();
      return enqueueMessage(sessionId, phoneNumber, `✅ *Thanks for connecting with KalaburagiTech!*\n\nHave a great day. 🚀\n\n_Type *Hi I Need KLB Connect Demo* anytime to start a new chat._`);
    }

    // 5. Normal Flow Matching
    // Check if it's a menu selection for the current flow
    if (state.currentFlowId) {
      const currentFlow = await FlowNode.findById(state.currentFlowId);
      
      if (currentFlow && currentFlow.type === FlowNodeType.MENU) {
        // Match by keyword (e.g., "1") or partial label
        const option = currentFlow.options.find(opt => 
          opt.keyword.toLowerCase() === text || 
          text === opt.label.toLowerCase()
        );

        if (option && option.nextFlowId) {
          const nextFlow = await FlowNode.findById(option.nextFlowId);
          if (nextFlow) {
            state.previousFlowId = state.currentFlowId;
            return this.executeFlow(state, nextFlow);
          }
        } else {
          // INVALID SELECTION HANDLING
          const invalidMsg = `❌ *Invalid selection.*\n\nPlease choose one of the available options above.\n\nReply *0* to Exit.\nType *Hi I Need KLB Connect Demo* for Main Menu.`;
          return enqueueMessage(sessionId, phoneNumber, invalidMsg);
        }
      } else if (!currentFlow) {
        // SELF-HEALING: If current flow ID is invalid (e.g. after re-seeding), reset to root
        console.log(`Current flow ${state.currentFlowId} not found, resetting to root.`);
        const rootFlow = await FlowNode.findOne({ organizationId: orgId, isRoot: true });
        if (rootFlow) {
          return this.executeFlow(state, rootFlow);
        }
      }
    }

    // 6. Global Catch-all for first-time or unknown (EXACT MATCH ONLY)
    const rootFlows = await FlowNode.find({ organizationId: orgId, isRoot: true });
    console.log(`[BOT] Checking against ${rootFlows.length} root flows...`);
    
    const triggeredFlow = rootFlows.find(f => {
      const match = f.triggerKeywords.some(kw => {
        const isMatch = text === kw.toLowerCase().trim();
        if (isMatch) console.log(`[BOT] 🎯 Keyword Match: "${text}" === "${kw}"`);
        return isMatch;
      });
      return match;
    });

    if (triggeredFlow) {
      console.log(`[BOT] 🎯 MATCHED ROOT FLOW: ${triggeredFlow.name}`);
      return this.executeFlow(state, triggeredFlow);
    }

    console.log(`[BOT] ⚠️ No match found for: "${text}"`);
  }

  private static async executeFlow(state: any, flow: any) {
    // Update state
    state.currentFlowId = flow._id;
    state.lastInteractionAt = new Date();
    state.conversationState = flow.type === FlowNodeType.MENU ? 'ACTIVE' : 'COMPLETED';
    await state.save();

    // Prepare Content
    let responseText = flow.content || '';
    
    if (flow.type === FlowNodeType.MENU && flow.options.length > 0) {
      responseText += '\n\n';
      flow.options.forEach((opt: any, index: number) => {
        responseText += `${index + 1}️⃣ ${opt.label}\n`;
      });
      responseText += '\n💬 *Reply with a number to continue.*';
    }

    // Append Footer for leaf nodes or completed flows
    if (state.conversationState === 'COMPLETED') {
      responseText += '\n\n🌐 *Visit:* kalaburgitech.com\n---\n❌ Reply *0* to Exit\n🚀 Type *Hi I Need KLB Connect Demo* to start chat';
    }

    // Handle Media & Content
    if (flow.mediaUrl) {
      // Send image with caption
      await enqueueMessage(state.sessionId, state.phoneNumber, responseText, {
        mediaUrl: flow.mediaUrl,
        mediaType: flow.mediaType || 'IMAGE'
      });
    } else {
      // Send text only
      await enqueueMessage(state.sessionId, state.phoneNumber, responseText);
    }
  }
}
