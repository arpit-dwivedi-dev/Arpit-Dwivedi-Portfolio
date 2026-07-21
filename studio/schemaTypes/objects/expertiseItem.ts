import {defineType, defineField} from 'sanity'

export const expertiseItem = defineType({
  name: 'expertiseItem',
  title: 'Expertise Item',
  type: 'object',
  fields: [
    defineField({name: 'title', title: 'Title', type: 'localeString', validation: (r) => r.required()}),
    defineField({name: 'subtitle', title: 'Subtitle', type: 'localeString', validation: (r) => r.required()}),
  ],
  preview: {
    select: {title: 'title.en'},
  },
})
