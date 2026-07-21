import {defineType, defineField} from 'sanity'

export const navLink = defineType({
  name: 'navLink',
  title: 'Nav Link',
  type: 'object',
  fields: [
    defineField({name: 'name', title: 'Label', type: 'localeString', validation: (r) => r.required()}),
    defineField({name: 'href', title: 'Href (e.g. "#about")', type: 'string', validation: (r) => r.required()}),
  ],
  preview: {
    select: {title: 'name.en', subtitle: 'href'},
  },
})
