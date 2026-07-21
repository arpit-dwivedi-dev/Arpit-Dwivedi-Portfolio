import {defineType, defineField} from 'sanity'

export const projectItem = defineType({
  name: 'projectItem',
  title: 'Project',
  type: 'object',
  fields: [
    defineField({name: 'title', title: 'Title (proper noun, not translated)', type: 'string', validation: (r) => r.required()}),
    defineField({name: 'subtitle', title: 'Subtitle', type: 'localeString'}),
    defineField({name: 'description', title: 'Description', type: 'localeText', validation: (r) => r.required()}),
    defineField({
      name: 'metrics',
      title: 'Metrics',
      type: 'array',
      of: [{type: 'statPair'}],
    }),
    defineField({
      name: 'tags',
      title: 'Tags (tech names, not translated)',
      type: 'array',
      of: [{type: 'string'}],
    }),
    defineField({name: 'featured', title: 'Featured', type: 'boolean', initialValue: false}),
    defineField({name: 'link', title: 'Live link', type: 'url'}),
  ],
  preview: {
    select: {title: 'title', subtitle: 'subtitle.en'},
  },
})
