/*
  # Aktiver Realtime paa besked-tabeller

  Tilfojer dating_messages, group_messages og group_room_members
  til Supabase Realtime publication saa live-opdateringer virker
  uden at siden skal genindlaeses.
*/

ALTER PUBLICATION supabase_realtime ADD TABLE dating_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE group_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE group_room_members;
