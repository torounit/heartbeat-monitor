# npm scripts

- `npm run test`: run tests.
- `npm run build`: Build project.
- `npm run tsc`: Type check.
- `npm run lint`: Run linter (Biome).
- `npm run lint:fix`: Run linter and fix issues.
- `npm run format`: Format code (Biome).
- `npm run check`: Run lint + format + import sorting checks (Biome).
- `npm run check:fix`: Run the above and fix issues.
- `npm run migrate:local`: Run local database migrations.
- `npm run migrate:remote`: Run remote database migrations.
- `npm run seed`: Seed local database with dummy data.
- `npm run dev`: Start development server.
- `npm run deploy`: Deploy to production.
- `npm run preview`: Preview production build locally.

# 注意事項

migrations ディレクトリは、Drizzle ORM のマイグレーションファイルを格納するためのディレクトリです。このディレクトリ内のファイルは、データベーススキーマの変更を管理するために使用されます。手動で編集しないでください。
