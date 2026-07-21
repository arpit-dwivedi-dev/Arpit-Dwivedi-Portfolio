import {defineType, defineField} from 'sanity'

export const serviceItem = defineType({
  name: 'serviceItem',
  title: 'Service',
  type: 'object',
  fields: [
    defineField({name: 'title', title: 'Title', type: 'localeString', validation: (r) => r.required()}),
    defineField({name: 'description', title: 'Description', type: 'localeText', validation: (r) => r.required()}),
    defineField({
      name: 'highlights',
      title: 'Highlights',
      type: 'array',
      of: [{type: 'localeString'}],
    }),
  ],
  preview: {
    select: {title: 'title.en'},
  },
})
