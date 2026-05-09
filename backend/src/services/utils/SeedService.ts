import FlowNode, { FlowNodeType } from '../../models/FlowNode';
import Organization from '../../models/Organization';
import mongoose from 'mongoose';
import path from 'path';

export class SeedService {
  static async seedKlbFlows() {
    console.log('Seeding KLB Connect Flows...');

    // 1. Get or Create Default Org
    let org = await Organization.findOne({ slug: 'klb-connect' });
    if (!org) {
      org = await Organization.create({
        name: 'KLB Connect Cloud',
        slug: 'klb-connect',
        apiKey: 'klb_prod_secret_123',
      });
    }

    const orgId = org._id;

    // Clear existing flows for this org
    await FlowNode.deleteMany({ organizationId: orgId });

    // 2. ROOT FLOW: Welcome Message
    const welcomeFlow = await FlowNode.create({
      organizationId: orgId,
      name: 'Welcome Flow',
      type: FlowNodeType.MENU,
      isRoot: true,
      triggerKeywords: ['hi i need klb connect demo'],
      mediaUrl: 'https://klb-media-production.up.railway.app/api/media/fd965171-de05-47f0-a238-b0646202bc7c',
      content: `🏢 *KalaburagiTech Pvt Ltd* 🚀\n\nWelcome to *KLB TECH*\n\nWe provide enterprise-grade software solutions and real-time project guidance.\n\n━━━━━━━━━━━━━━━\n💻 Our Services\n━━━━━━━━━━━━━━━`,
      options: [
        { label: 'College Projects', keyword: '1' },
        { label: 'Mobile App Development', keyword: '2' },
        { label: 'Website Development', keyword: '3' },
        { label: 'AI / ML Solutions', keyword: '4' },
        { label: 'Internship Guidance', keyword: '5' },
      ],
    });

    // 3. OPTION 1: College Projects
    const projectsFlow = await FlowNode.create({
      organizationId: orgId,
      name: 'College Projects',
      type: FlowNodeType.MENU,
      mediaUrl: 'https://placehold.co/600x400/000000/orange?text=Projects+Poster',
      content: `🎓 *College Project Services*\n\n✅ Final Year Projects\n✅ AI / ML Projects\n✅ MERN Stack Projects\n✅ IEEE Projects\n✅ Real-Time Internship\n✅ Documentation Support\n\nChoose below 👇`,
      options: [
        { label: 'AI Projects', keyword: '1' },
        { label: 'Web Projects', keyword: '2' },
        { label: 'Android Projects', keyword: '3' },
        { label: 'Internship Details', keyword: '4' },
        { label: 'Talk To Team', keyword: '5' },
      ],
      parentFlowId: welcomeFlow._id.toString(),
    });

    // 4. OPTION 2: Mobile App Dev (Direct Details)
    const mobileFlow = await FlowNode.create({
      organizationId: orgId,
      name: 'Mobile App Dev',
      type: FlowNodeType.MESSAGE,
      mediaUrl: 'https://placehold.co/600x400/000000/orange?text=App+Showcase',
      content: `📱 *Mobile App Development*\n\nWe develop:\n✅ Android Apps\n✅ iOS Apps\n✅ Startup Apps\n✅ AI Integrated Apps\n✅ Business Applications\n\n🌐 Start your project: *kalaburgitech.com*\n\n📞 Or call: *+91 9108080161*`,
      parentFlowId: welcomeFlow._id.toString(),
    });

    // 5. OPTION 3: Website Dev (Direct Details)
    const websiteFlow = await FlowNode.create({
      organizationId: orgId,
      name: 'Website Dev',
      type: FlowNodeType.MESSAGE,
      mediaUrl: 'https://placehold.co/600x400/000000/orange?text=Website+Banner',
      content: `🌐 *Website Development Services*\n\nWe build:\n✅ Business Websites\n✅ AI Websites\n✅ 3D Websites\n✅ Portfolio Websites\n✅ E-Commerce Platforms\n\n🌐 View Portfolio: *kalaburgitech.com*`,
      parentFlowId: welcomeFlow._id.toString(),
    });

    // 6. LEAF NODES: College Project Types
    const aiProjectsFlow = await FlowNode.create({
      organizationId: orgId,
      name: 'AI Projects Details',
      type: FlowNodeType.MESSAGE,
      content: `🤖 *AI / ML Project Categories*\n\n1. Deep Learning (CNN/RNN)\n2. Natural Language Processing\n3. Computer Vision\n4. Predictive Analytics\n\n*All projects include:*\n✅ Source Code\n✅ Dataset\n✅ PPT & Report\n✅ Installation Guide\n\n🌐 Explore more: *kalaburgitech.com*\n\nWould you like to book a demo? Reply with "demo".`,
      parentFlowId: projectsFlow._id.toString(),
    });

    const webProjectsFlow = await FlowNode.create({
      organizationId: orgId,
      name: 'Web Projects Details',
      type: FlowNodeType.MESSAGE,
      content: `🌐 *MERN / Web Projects*\n\n1. E-Commerce Platforms\n2. Hospital Management\n3. Learning Management Systems\n4. Real-time Chat Apps\n\n*Tech Stack:* React, Node.js, MongoDB, Next.js.\n\n🌐 View Portfolio: *kalaburgitech.com*\n\nReply with "demo" to see one live!`,
      parentFlowId: projectsFlow._id.toString(),
    });

    const androidProjectsFlow = await FlowNode.create({
      organizationId: orgId,
      name: 'Android Projects Details',
      type: FlowNodeType.MESSAGE,
      content: `📱 *Android Project Categories*\n\n1. Firebase Integrated Apps\n2. SQLite / Room Database\n3. API based Applications\n4. Kotlin / Java Projects\n\n🌐 Explore: *kalaburgitech.com*`,
      parentFlowId: projectsFlow._id.toString(),
    });

    const internshipFlow = await FlowNode.create({
      organizationId: orgId,
      name: 'Internship Details',
      type: FlowNodeType.MESSAGE,
      content: `🎓 *Internship Guidance*\n\n✅ 1-6 Months Programs\n✅ Real-time Project Experience\n✅ Mentorship from Experts\n✅ Certification & LOR\n\n🌐 Apply at: *kalaburgitech.com*`,
      parentFlowId: welcomeFlow._id.toString(),
    });

    const talkToTeamFlow = await FlowNode.create({
      organizationId: orgId,
      name: 'Talk To Team',
      type: FlowNodeType.MESSAGE,
      content: `📞 *Connect with our Experts*\n\nPlease wait a moment. Our technical team is being notified.\n\nYou can also call us directly at: *+91 9108080161*\n\n_Thank you for choosing KalaburagiTech!_`,
    });

    // 7. Link College Projects Options
    projectsFlow.options[0].nextFlowId = aiProjectsFlow._id.toString();
    projectsFlow.options[1].nextFlowId = webProjectsFlow._id.toString();
    projectsFlow.options[2].nextFlowId = androidProjectsFlow._id.toString();
    projectsFlow.options[3].nextFlowId = internshipFlow._id.toString();
    projectsFlow.options[4].nextFlowId = talkToTeamFlow._id.toString();
    await projectsFlow.save();

    // 9. Link root options to the new flows
    welcomeFlow.options[0].nextFlowId = projectsFlow._id.toString();
    welcomeFlow.options[1].nextFlowId = mobileFlow._id.toString();
    welcomeFlow.options[2].nextFlowId = websiteFlow._id.toString();
    welcomeFlow.options[3].nextFlowId = aiProjectsFlow._id.toString(); 
    welcomeFlow.options[4].nextFlowId = internshipFlow._id.toString();
    await welcomeFlow.save();

    console.log('KLB Connect Flows seeded successfully with deep links!');
  }
}
