import Heading from '@tiptap/extension-heading';

export const CustomHeading = Heading.extend({
    addAttributes() {
        return {
            ...this.parent?.(),
            id: {
                default: null,
                parseHTML: (element: HTMLElement) => element.getAttribute('id'),
                renderHTML: (attributes: Record<string, unknown>) => {
                    if (!attributes.id) {
                        return {};
                    }
                    return { id: attributes.id };
                },
            },
        };
    },
    
    // Inject ID when the text changes or heading is created natively
    // A simpler way to ensure IDs is to let a transaction listener or a 
    // hook handle the generation dynamically off the innerText, but for 
    // TipTap we can patch it globally or handle it on demand in HTML.
    // We will handle dynamic IDs in the parent component `RichTextEditor` 
    // to ensure they are synchronized with the Table of Contents flawlessly, 
    // but the Schema must allow an ID attribute.
});
