import type Quill from 'quill'
import contractIcon from './icons/contractIcon.png'
import expandIcon from './icons/expandIcon.png'
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
      const data = this.quill.getLeaf(range.index) as any
      if (source === 'user') {
        document.querySelectorAll('.ql-mind-map-left-up-control').forEach((el) => {
          (el as HTMLElement).style.display = 'none'
        })
        document.querySelectorAll('.ql-mind-map-control').forEach((el) => {
          (el as HTMLElement).style.display = 'none'
        })
        document.querySelectorAll('.ql-mind-map-control-panelStatus').forEach((el) => {
          (el as HTMLElement).style.backgroundImage = `url(${contractIcon})`
        })
        if (leaf?.mindMap) {
          let currentNode = leaf.domNode
          let mindMapContainer = null
          while (currentNode && !mindMapContainer) {
            if (currentNode.querySelector('.ql-mind-map-left-up-control')
              && currentNode.querySelector('.ql-mind-map-control')) {
              mindMapContainer = currentNode
            }
            else {
              currentNode = currentNode.parentNode
            }
          }

          if (mindMapContainer) {
            const leftUpControl = mindMapContainer.querySelector('.ql-mind-map-left-up-control') as HTMLElement | null
            const control = mindMapContainer.querySelector('.ql-mind-map-control') as HTMLElement | null
            const panelStatusIcon = mindMapContainer.querySelector('.ql-mind-map-control-panelStatus') as HTMLElement | null

            if (data[1] == 0 || data[1] == 1) {
              if (leftUpControl) leftUpControl.style.display = 'inline-flex'
              if (control) control.style.display = 'flex'
            }
            else {
              if (leftUpControl) leftUpControl.style.display = 'inline-flex'
              if (control) control.style.display = 'flex'
              this.quill.blur()
            }

            if (panelStatusIcon) {
              panelStatusIcon.style.backgroundImage = `url(${expandIcon})`
            }
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
      this.quill.insertEmbed(range.index + 1, 'mind-map-placeholder', defaultData, 'user')
    }
  }
}
