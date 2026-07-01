import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const PROGRAM_CONTENT = {
  Youth: {
    day2: {
      subject: "See What Other Parents Are Saying",
      lines: [
        "Still thinking about martial arts for your child?",
        "Don't just take our word for it — hear from other parents:",
        '<em>"My son went from shy and quiet to confident and proud. The transformation in just 3 months was incredible."</em> — Sarah M., Parent',
        '<em>"The discipline and focus my daughter learned here carried over into school and home. Best decision we made."</em> — Michael T., Parent',
        "Ready to see the difference for yourself?",
      ],
    },
    day4: {
      subject: "More Than Just Kicks & Punches",
      lines: [
        "At Chosen Martial Arts Academy, our Youth program builds:",
        "<strong>• Confidence & Self-Esteem</strong>",
        "<strong>• Focus & Discipline</strong>",
        "<strong>• Respect for Others</strong>",
        "<strong>• Anti-Bullying Skills</strong>",
        "<strong>• Fitness & Healthy Habits</strong>",
        "Our instructors specialize in working with kids of all personalities and skill levels.",
        "Ready to start your child's journey?",
      ],
    },
    day7: {
      subject: "Last Chance: Your Child's Free Trial Is Waiting!",
      lines: [
        "This is your last chance to claim your child's FREE 1-week trial!",
        "Spots fill up fast, and we'd hate for your child to miss out on building confidence, discipline, and friendships.",
        "Book now before you forget.",
      ],
    },
  },
  Teen: {
    day2: {
      subject: "Teens Thrive at Chosen Martial Arts",
      lines: [
        "Still thinking about trying martial arts?",
        "Hear from our teen students:",
        '<em>"I was dealing with a lot of stress from school. Training here gave me an outlet and a community that has my back."</em> — Jake, 16',
        '<em>"I came in not knowing anyone. Now I have a second family. The confidence I\'ve gained is unreal."</em> — Maya, 15',
        "Ready to see for yourself?",
      ],
    },
    day4: {
      subject: "More Than Just a Workout",
      lines: [
        "At Chosen Martial Arts Academy, our Teen program builds:",
        "<strong>• Confidence & Leadership</strong>",
        "<strong>• Stress Relief & Mental Wellness</strong>",
        "<strong>• Self-Defense Skills</strong>",
        "<strong>• Fitness & Conditioning</strong>",
        "<strong>• A Positive Peer Group</strong>",
        "Our instructors understand the unique challenges teens face and create a supportive environment to grow.",
        "Ready to start your journey?",
      ],
    },
    day7: {
      subject: "Last Chance: Your Free Trial Is Waiting!",
      lines: [
        "This is your last chance to claim your FREE 1-week trial!",
        "Don't miss out on building confidence, fitness, and friendships that last a lifetime.",
        "Book now before you forget.",
      ],
    },
  },
  Adult: {
    day2: {
      subject: "See What Our Adult Students Say",
      lines: [
        "Still thinking about trying martial arts?",
        "Hear from our adult students:",
        '<em>"I was nervous to start at 35, but the instructors made me feel welcome from day one. Best decision I\'ve ever made."</em> — James T.',
        '<em>"I came for the workout and stayed for the community. I\'m in the best shape of my life."</em> — Lisa K.',
        "Ready to see for yourself?",
      ],
    },
    day4: {
      subject: "More Than Just Kicks & Punches",
      lines: [
        "At Chosen Martial Arts Academy, our Adult program delivers:",
        "<strong>• Stress Relief & Mental Clarity</strong>",
        "<strong>• Real Self-Defense Skills</strong>",
        "<strong>• Fitness & Weight Management</strong>",
        "<strong>• Confidence & Empowerment</strong>",
        "<strong>• A Supportive Community</strong>",
        "It's never too late to start. Our beginner-friendly classes welcome all fitness levels.",
        "Ready to start your journey?",
      ],
    },
    day7: {
      subject: "Last Chance: Your Free Trial Is Waiting!",
      lines: [
        "This is your last chance to claim your FREE 1-week trial!",
        "Don't miss out on the opportunity to transform your fitness, confidence, and wellbeing.",
        "Book now before you forget.",
      ],
    },
  },
  default: {
    day2: {
      subject: "See What Our Students Say",
      lines: [
        "Still thinking about trying martial arts?",
        "Don't just take our word for it — hear from our students:",
        '<em>"My son has gained so much confidence and discipline since joining Chosen. It\'s been life-changing."</em> — Sarah M., Parent',
        '<em>"I was nervous to start as an adult, but the instructors made me feel welcome from day one. Best decision I\'ve ever made."</em> — James T., Student',
        "Ready to see for yourself?",
      ],
    },
    day4: {
      subject: "More Than Just Kicks & Punches",
      lines: [
        "At Chosen Martial Arts Academy, we believe martial arts is about more than just physical training. It's about building:",
        "<strong>• Discipline & Focus</strong>",
        "<strong>• Confidence & Self-Esteem</strong>",
        "<strong>• Respect & Character</strong>",
        "<strong>• Fitness & Healthy Habits</strong>",
        "Our experienced instructors create a supportive environment where students of all ages and abilities can thrive.",
        "Ready to start your journey?",
      ],
    },
    day7: {
      subject: "Last Chance: Your Free Trial Is Waiting!",
      lines: [
        "This is your last chance to claim your FREE 1-week trial at Chosen Martial Arts Academy!",
        "Don't miss out on this opportunity to transform your life through martial arts training.",
        "Book now before you forget.",
      ],
    },
  },
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const settingsList = await base44.asServiceRole.entities.NotificationSettings.list().catch(() => []);
    const settings = settingsList[0] || {};
    const channel = settings.lead_alerts_channel || 'email';

    const allLeads = await base44.asServiceRole.entities.Lead.list();
    const activeLeads = allLeads.filter(l =>
      (l.pipeline_stage === 'new_lead' || l.pipeline_stage === 'contacted' || !l.pipeline_stage) &&
      l.email
    );

    const now = new Date();
    let processed = 0;
    const appUrl = Deno.env.get('BASE44_APP_URL') || '';

    for (const lead of activeLeads) {
      const createdDate = new Date(lead.created_date);
      const daysSince = Math.floor((now - createdDate) / (1000 * 60 * 60 * 24));
      const trialLink = `${appUrl}/trial-booking?lead=${lead.id}`;
      const leadName = lead.full_name || 'there';
      const program = lead.program_of_interest || 'default';
      const content = PROGRAM_CONTENT[program] || PROGRAM_CONTENT.default;

      // Day 2: Testimonial email
      if (daysSince === 2) {
        try {
          await base44.asServiceRole.functions.invoke('sendBrandedEmail', {
            to: lead.email,
            subject: content.day2.subject,
            body_lines: [`Hi ${leadName},`, ...content.day2.lines],
            action_url: trialLink,
            action_label: 'Book Your Free Trial',
          });

          await base44.asServiceRole.entities.LeadActivityLog.create({
            lead_id: lead.id,
            lead_name: lead.full_name || '',
            action_type: 'email',
            content: `Day 2 drip: "${content.day2.subject}" (${program} campaign)`,
            admin_name: 'System',
          }).catch(() => {});
          processed++;
        } catch (e) { console.error('Day 2 email failed:', e); }
      }

      // Day 4: Benefits email
      if (daysSince === 4) {
        try {
          await base44.asServiceRole.functions.invoke('sendBrandedEmail', {
            to: lead.email,
            subject: content.day4.subject,
            body_lines: [`Hi ${leadName},`, ...content.day4.lines],
            action_url: trialLink,
            action_label: 'Book Your Free Trial',
          });

          await base44.asServiceRole.entities.LeadActivityLog.create({
            lead_id: lead.id,
            lead_name: lead.full_name || '',
            action_type: 'email',
            content: `Day 4 drip: "${content.day4.subject}" (${program} campaign)`,
            admin_name: 'System',
          }).catch(() => {});
          processed++;
        } catch (e) { console.error('Day 4 email failed:', e); }
      }

      // Day 7: Final email + admin task
      if (daysSince === 7) {
        try {
          await base44.asServiceRole.functions.invoke('sendBrandedEmail', {
            to: lead.email,
            subject: content.day7.subject,
            body_lines: [`Hi ${leadName},`, ...content.day7.lines],
            action_url: trialLink,
            action_label: 'Claim My Free Trial',
          });

          await base44.asServiceRole.entities.LeadActivityLog.create({
            lead_id: lead.id,
            lead_name: lead.full_name || '',
            action_type: 'email',
            content: `Day 7 drip: "${content.day7.subject}" (${program} campaign)`,
            admin_name: 'System',
          }).catch(() => {});

          await base44.asServiceRole.entities.FollowUpTask.create({
            lead_id: lead.id,
            lead_name: lead.full_name || '',
            task_type: 'call',
            due_date: now.toISOString().split('T')[0],
            status: 'pending',
            admin_notes: 'Day 7 follow-up: Final attempt to convert lead. Call to offer incentive (e.g., free uniform).',
          });
          processed++;
        } catch (e) { console.error('Day 7 email failed:', e); }
      }
    }

    return Response.json({ success: true, processed, totalLeads: activeLeads.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});