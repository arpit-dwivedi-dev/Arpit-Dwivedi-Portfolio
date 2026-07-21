import type {StructureResolver} from 'sanity/structure'

// Site Content is a singleton — always the same fixed document id, so this
// structure links straight to it instead of showing a generic "create new"
// list (which would let an editor accidentally spawn a second copy).
export const structure: StructureResolver = (S) =>
  S.list()
    .title('Content')
    .items([
      S.listItem()
        .title('Site Content')
        .id('siteContent')
        .child(
          S.document()
            .schemaType('siteContent')
            .documentId('siteContent'),
        ),
    ])
