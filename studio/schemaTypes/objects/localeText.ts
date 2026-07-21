import {defineType, defineField} from 'sanity'

export const localeText = defineType({
  name: 'localeText',
  title: 'Paragraph (EN / HI)',
  type: 'object',
  fields: [
    defineField({name: 'en', title: 'English', type: 'text', rows: 4, validation: (r) => r.required()}),
    defineField({name: 'hi', title: 'Hindi (हिन्दी)', type: 'text', rows: 4, validation: (r) => r.required()}),
  ],
  preview: {
    select: {title: 'en'},
  },
})
