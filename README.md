## Next JS Starter Template

Use PNPM (would love to use Bun but too much stuff breaks)

Uses

- Next JS
- Tailwind CSS
- TypeScript
- ESLint
- ZSA for Server Actions
- Shadcn for UI Components
- Next Auth
- Drizzle + Postgres (using @paralleldrive/cuid2 for id generation)

## Getting Started

Search for `change_me` and replace with your project name

First start your database

```bash
./start-database.sh
```

Run your drizzle migrations

```bash
pnpm run db:generate

pnpm run db:migrate
```

Create your auth secret

```bash
npx auth secret
```

First, run the development server:

```bash
pnpm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

// Load our library that generates the document
import Docxtemplater from 'docxtemplater'
// Load PizZip library to load the docx/pptx/xlsx file in memory
import PizZip from 'pizzip'

// Builtin file system utilities
import fs from 'fs'
import path from 'path'
import InspectModule from 'docxtemplater/js/inspect-module'

const iModule = new InspectModule()

// Load the docx file as binary content
const content = fs.readFileSync(
path.resolve(\_\_dirname, '../input.docx'),
'binary',
)

// Unzip the content of the file
const zip = new PizZip(content)

/\*

- Parse the template.
- This function throws an error if the template is invalid,
- for example, if the template is "Hello {user" (missing closing tag)
  \*/
  const doc = new Docxtemplater(zip, {
  modules: [iModule],
  paragraphLoop: true,
  linebreaks: true,
  })

const tags = iModule.getAllStructuredTags()
console.log(tags)
