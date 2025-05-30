import * as dayjs from 'dayjs'
import { v4 as uuid } from 'uuid'

export const scratchpadNote = {
  id: uuid(),
  text: `# Scratchpad

The easiest note to find.`,
  category: '',
  scratchpad: true,
  favorite: false,
  created: dayjs().format('YYYY-MM-DD'),
  lastUpdated: dayjs().format(),
}
