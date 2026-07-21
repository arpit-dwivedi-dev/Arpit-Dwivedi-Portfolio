import {defineType, defineField} from 'sanity'

export const statPair = defineType({
  name: 'statPair',
  title: 'Stat (value + label)',
  type: 'object',
  fields: [
    defineField({name: 'value', title: 'Value (e.g. "15+")', type: 'string', validation: (r) => r.required()}),
    defineField({name: 'label', title: 'Label', type: 'localeString', validation: (r) => r.required()}),
  ],
  preview: {
    select: {title: 'value', subtitle: 'label.en'},
  },
})
