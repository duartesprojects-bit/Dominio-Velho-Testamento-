# Firestore Security Specification

## Data Invariants
1. `Scripture` must have a valid reference and text. ID must be alphanumeric.
2. `UserProfile` must match the authenticated user's UID.
3. `UserNote` must belong to the owner, and cannot be read by others.
4. `Favorite` must belong to the owner.

## The "Dirty Dozen" Payloads (To be rejected)
1. Write to `scriptures` as a non-admin.
2. Read another user's `notes`.
3. Create a `note` with a `userId` that is not the current user's UID.
4. Update a `note`'s `userId` field.
5. Create a `scripture` with missing required fields.
6. Delete a `scripture` as a non-admin.
7. Update `isAdmin` field in own profile as non-admin.
8. Read all user profiles as a non-admin.
9. Inject massive strings into `content` fields.
10. Use an invalid path for a document.
11. Write to a collection not defined in the blueprint.
12. Update `createdAt` field if it were immutable.

## Test Goals
- Ensure `allow read` for `scriptures` for everyone.
- Ensure `allow write` for `scriptures` only for `isAdmin()`.
- Ensure strict ownership checks on `/users/{userId}/...` paths.
