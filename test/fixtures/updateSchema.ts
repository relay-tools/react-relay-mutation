import { writeFileSync } from 'fs';
import { join } from 'path';
import { printSchema } from 'graphql/utilities';

import schema from './schema';

writeFileSync(join(__dirname, 'schema.graphql'), printSchema(schema));
