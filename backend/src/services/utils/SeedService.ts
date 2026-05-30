import Menu from '../../models/Menu';
import AutoReplyRule from '../../models/AutoReplyRule';
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

    const orgId = org._id.toString();

    // Clear existing menus and rules for this org
    await Menu.deleteMany({ organizationId: orgId });
    await AutoReplyRule.deleteMany({ organizationId: orgId });

    // 2. ROOT MENU: Welcome Message
    const welcomeMenu = await Menu.create({
      organizationId: orgId,
      title: '🏢 *KalaburagiTech Pvt Ltd* 🚀',
      content: `Welcome to *KLB TECH*\n\nWe provide enterprise-grade software solutions and real-time project guidance.\n\n━━━━━━━━━━━━━━━\n💻 Our Services\n━━━━━━━━━━━━━━━`,
      isRoot: true,
      active: true,
      options: [
        { label: 'Website Development', keyword: '1', action: 'NEXT_MENU' },
        { label: 'College Projects', keyword: '2', action: 'NEXT_MENU' },
        { label: 'App Development', keyword: '3', action: 'NEXT_MENU' },
        { label: 'Talk To Team', keyword: '4', action: 'NEXT_MENU' },
      ],
    });

    // 3. OPTION 1: Website Development (Menu)
    const websiteMenu = await Menu.create({
      organizationId: orgId,
      title: '🌐 Website Development Packages',
      content: `✅ Landing Page Website\n₹5,000\n\n✅ Business Website\n₹10,000\n\n✅ Dynamic Website\n₹20,000+\n\nFeatures:\n\n✔ Mobile Friendly\n✔ Modern UI\n✔ SEO Ready\n✔ Fast Loading\n\nPortfolio:\nhttps://yourwebsite.com/portfolio`,
      active: true,
      options: [
        { label: 'Contact Team', keyword: '1', action: 'NEXT_MENU' },
        { label: 'Back To Menu', keyword: '2', action: 'NEXT_MENU', targetId: welcomeMenu._id.toString() }
      ],
    });

    // 4. OPTION 3: App Development (Menu)
    const appMenu = await Menu.create({
      organizationId: orgId,
      title: '📱 Mobile App Development',
      content: `✅ Android App\n\n✅ iOS App\n\n✅ Admin Dashboard\n\nStarting From:\n₹25,000\n\nFeatures:\n\n✔ User Login\n✔ Push Notifications\n✔ Admin Panel\n✔ Cloud Database\n\nPortfolio:\nhttps://yourwebsite.com/apps`,
      active: true,
      options: [
        { label: 'Contact Team', keyword: '1', action: 'NEXT_MENU' },
        { label: 'Back To Menu', keyword: '2', action: 'NEXT_MENU', targetId: welcomeMenu._id.toString() }
      ],
    });

    // 5. OPTION 2: College Projects (Menu)
    const projectsMenu = await Menu.create({
      organizationId: orgId,
      title: '🎓 *College Project Services*',
      content: `✅ Final Year Projects\n✅ AI / ML Projects\n✅ MERN Stack Projects\n✅ IEEE Projects\n✅ Real-Time Internship\n✅ Documentation Support\n\nChoose below 👇`,
      active: true,
      options: [
        { label: 'Talk To Team', keyword: '1', action: 'NEXT_MENU' },
      ],
    });

    // 6. Contact Team (Menu/Message)
    const contactMenu = await Menu.create({
      organizationId: orgId,
      title: '📞 *Contact Team*',
      content: `Please wait a moment. Our technical team is being notified.\n\nYou can also call us directly at: *+91 9108080161*`,
      active: true,
      options: [
        { label: 'Back To Menu', keyword: '1', action: 'NEXT_MENU', targetId: welcomeMenu._id.toString() }
      ]
    });

    // 7. Link all menus
    welcomeMenu.options[0].targetId = websiteMenu._id.toString();
    welcomeMenu.options[1].targetId = projectsMenu._id.toString();
    welcomeMenu.options[2].targetId = appMenu._id.toString();
    welcomeMenu.options[3].targetId = contactMenu._id.toString();
    
    websiteMenu.options[0].targetId = contactMenu._id.toString();
    appMenu.options[0].targetId = contactMenu._id.toString();
    projectsMenu.options[0].targetId = contactMenu._id.toString();

    await welcomeMenu.save();
    await websiteMenu.save();
    await appMenu.save();
    await projectsMenu.save();

    // 5. Create AutoReply Rule
    await AutoReplyRule.create({
      organizationId: orgId,
      keyword: 'pricing',
      matchType: 'CONTAINS',
      replyType: 'TEXT',
      replyContent: '💰 *Pricing*\n\nPlease visit our website kalaburgitech.com for detailed pricing.',
      active: true
    });

    console.log('KLB Connect Menus and Rules seeded successfully!');
  }
}
