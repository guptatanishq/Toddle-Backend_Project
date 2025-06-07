# GraphQL API Notes

This file is for internal notes on the GraphQL implementation for the Journal App. For details on the schema and resolvers, see the code in `src/graphql/`.

- The GraphQL API is implemented using Apollo Server and Express.
- Authentication is handled via JWT in the context.
- The schema includes types for users, journals, attachments, and student tags.
- File uploads are supported via the GraphQL multipart request spec.
- See the codebase for actual implementation details.