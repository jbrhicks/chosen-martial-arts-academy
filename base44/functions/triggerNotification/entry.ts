import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);

    // This function fans out system notifications (including admin broadcasts)
    // via asServiceRole, so it must only accept calls from authenticated admins.
    // Unauthenticated callers could otherwise broadcast arbitrary messages.
    const caller = await base44.auth.me().catch(() => null);
    if (!caller || caller.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const body = await req.json();
    const event = body.event || {};
    const data = body.data || {};
    const entity = event.entity_name;
    const type = event.type;

    const notify = (payload) => base44.asServiceRole.functions.invoke("createNotification", payload);

    if (entity === "Enrollment" && type === "create") {
      await notify({
        recipient_type: "admin",
        notification_type: "enrollment",
        preview_text: `New enrollment: ${data.user_name || "a student"} → ${data.program || "program"}.`,
        target_type: "profile",
        target_id: data.user_id,
        sender_name: "Enrollment System",
      });
      if (data.user_id) {
        await notify({
          recipient_type: "user",
          recipient_id: data.user_id,
          notification_type: "enrollment",
          preview_text: `You've been enrolled in ${data.program || "a program"}. Welcome to the academy!`,
          target_type: "curriculum",
          sender_name: "Chosen Academy",
        });
      }
    } else if (entity === "MembershipRequest" && type === "create") {
      const reqLabel = data.request_type
        ? data.request_type.charAt(0).toUpperCase() + data.request_type.slice(1)
        : "Account";
      await notify({
        recipient_type: "admin",
        notification_type: "account_request",
        preview_text: `${reqLabel} request from ${data.user_name || "a member"}. Tap to process.`,
        target_type: "membership",
        target_id: event.entity_id,
        sender_name: "Membership System",
      });
    } else if (entity === "Comment" && type === "create") {
      if (data.post_id) {
        const posts = await base44.asServiceRole.entities.Post.filter({ id: data.post_id });
        const post = posts[0];
        if (post && post.author_id && post.author_id !== data.author_id) {
          await notify({
            recipient_type: "user",
            recipient_id: post.author_id,
            notification_type: "post_comment",
            preview_text: `${data.author_name || "Someone"} commented on your post.`,
            target_type: "post",
            target_id: data.post_id,
            sender_id: data.author_id,
            sender_name: data.author_name || "Member",
          });
        }
      }
    } else if (entity === "Event" && type === "create") {
      await notify({
        recipient_type: "all",
        notification_type: "new_event",
        preview_text: `New event: ${data.title || "New Event"}. Tap to view details and register.`,
        target_type: "event",
        target_id: event.entity_id,
        sender_name: "Chosen Academy",
      });
    } else if (entity === "Post" && type === "create") {
      if (data.post_type === "rank_up" && data.spotlight_student_id) {
        await notify({
          recipient_type: "user",
          recipient_id: data.spotlight_student_id,
          notification_type: "rank_up",
          preview_text: `Congratulations! You've been promoted to ${data.rank_up_new_belt || "your new rank"}. Tap to view your unlocked curriculum.`,
          target_type: "curriculum",
          target_id: event.entity_id,
          sender_name: "Chosen Academy",
        });
      } else if (data.is_announcement || data.post_type === "broadcast" || data.is_pinned) {
        await notify({
          recipient_type: "all",
          notification_type: "announcement",
          preview_text: `New announcement: ${data.content ? data.content.slice(0, 90) : "tap to read"}.`,
          target_type: "post",
          target_id: event.entity_id,
          sender_name: data.author_name || "Chosen Academy",
        });
      }
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}