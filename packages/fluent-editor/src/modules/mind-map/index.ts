import type Quill from 'quill'
import './formats/mind-map-blot'

export class MindMapModule {
  quill: Quill
  toolbar: any

  constructor(quill: Quill, options: any) {
    this.quill = quill
    this.toolbar = quill.getModule('toolbar')
    const domNode = document.querySelector('.ql-mind-map')

    if (domNode) {
      domNode.addEventListener('click', () => {
        this.insertMindMapEditor()
      })
    }
    this.quill.on('selection-change', (range: any, oldRange: any, source: string) => {
      if (!range) return
      const leaf = this.quill.getLeaf(range.index)[0] as any
      if (source === 'user') {
        const leftUpControl = document.querySelector('.ql-mind-map-left-up-control') as HTMLElement | null
        const control = document.querySelector('.ql-mind-map-control') as HTMLElement | null
        if (leaf?.mindMap) {
          leftUpControl.style.display = 'block'
          control.style.display = 'flex'
          this.quill.blur()
        }
        else {
          if (leftUpControl) {
            leftUpControl.style.display = 'none'
          }
          if (control) {
            control.style.display = 'none'
          }
        }
      }
    })
  }

  public insertMindMapEditor(): void {
    const range = this.quill.getSelection()
    if (range) {
      const defaultData = {
        data: {
          text: '根节点',
          expand: true,
          uid: '36bae545-da0b-4c08-be14-ff05f7f05d0a',
          isActive: false,
        },
        children: [
          {
            data: {
              text: '二级节点',
              uid: 'ef0895d2-b5cc-4214-b0ee-e29f8f02420d',
              expand: true,
              richText: false,
              isActive: false,
            },
            children: [],
          },
        ],
        smmVersion: '0.14.0-fix.1',
      }
      this.quill.insertText(range.index, '\n', 'user')
      this.quill.insertEmbed(range.index + 1, 'mind-map-placeholder', defaultData, 'user')
      this.quill.insertText(range.index + 2, '\n', 'user')
    }
  }
}
