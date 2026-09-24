# Feature: Display request history

## Business need

Users need to understand when important request changes happened and who made them.

## Confirmed rules

- Record successful status and reviewer-assignment changes.
- Each entry identifies the action, actor, and time.
- Display entries in chronological order.
- Failed operations must not create history entries.

## Acceptance criteria

1. A request detail page displays its recorded history.
2. Each entry shows a readable action, actor, and timestamp.
3. Entries appear from oldest to newest.
4. A successful status change creates one entry.
5. A failed status change creates no entry.

## Out of scope

- Editing or deleting history
- Exporting history
- Recording read-only views

