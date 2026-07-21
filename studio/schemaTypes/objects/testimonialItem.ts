import {defineType, defineField} from 'sanity'

export const testimonialItem = defineType({
  name: 'testimonialItem',
  title: 'Testimonial',
  type: 'object',
  fields: [
    defineField({name: 'quote', title: 'Quote', type: 'localeText', validation: (r) => r.required()}),
    defineField({name: 'name', title: 'Name', type: 'localeString', validation: (r) => r.required()}),
    defineField({name: 'business', title: 'Business', type: 'localeString', validation: (r) => r.required()}),
  ],
  preview: {
    select: {title: 'name.en', subtitle: 'business.en'},
  },
})
