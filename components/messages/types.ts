export interface ConversationView {
  id: string;
  type: 'dm' | 'group';
  display_name: string;
  last_message_at: string;
  my_last_read_at: string;
  other_user_id: string | null;
  created_by: string | null;
  my_role: string;
}

export interface MessageRow {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  edited_at: string | null;
  deleted_at: string | null;
  moderation_status: 'approved' | 'flagged' | 'removed';
}

export interface MemberProfile {
  username: string;
  display_name: string | null;
}
