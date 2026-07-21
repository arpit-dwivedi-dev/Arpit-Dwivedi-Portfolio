import {defineType, defineField} from 'sanity'

export const localeString = defineType({
  name: 'localeString',
  title: 'Text (EN / HI)',
  type: 'object',
  fields: [
    defineField({name: 'en', title: 'English', type: 'string', validation: (r) => r.required()}),
    defineField({name: 'hi', title: 'Hindi (हिन्दी)', type: 'string', validation: (r) => r.required()}),
  ],
  preview: {
    select: {title: 'en'},
  },
})
