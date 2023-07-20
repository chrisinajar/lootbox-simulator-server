import { mergeTypeDefs } from '@graphql-tools/merge';

import player from './player';

export default mergeTypeDefs([player]);
