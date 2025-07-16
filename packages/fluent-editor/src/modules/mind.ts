import type { Root } from 'parchment'
import type { BlockEmbed as TypeBlockEmbed } from 'quill/blots/block'
import Quill from 'quill'
import MindMap from 'simple-mind-map'
import Drag from 'simple-mind-map/src/plugins/Drag.js'
import '../assets/mindmap.scss'

const BlockEmbed = Quill.import('blots/block/embed') as typeof TypeBlockEmbed

class MindmapPlaceholderBlot extends BlockEmbed {
  static blotName = 'mindmap-placeholder'
  static tagName = 'div'
  static className = 'ql-mindmap'
  private mm: MindMap | null = null
  private data: any
  private zoomCount = 0

  constructor(scroll: Root, domNode: HTMLElement) {
    super(scroll, domNode)
    this.domNode.classList.add('ql-MindMap-container')
    this.domNode.style.height = '500px'
    this.domNode.style.border = '1px solid #e8e8e8'
    this.data = MindmapPlaceholderBlot.value(this.domNode)
    this.initMindMap()
  }

  static value(domNode: HTMLElement): any {
    const dataStr = JSON.parse(domNode.getAttribute('data-mm'))
    return dataStr.root ? dataStr.root : dataStr
  }

  static create(value: any): HTMLElement {
    const node = super.create() as HTMLElement
    if (value) {
      console.warn(value)
      node.setAttribute('data-mm', JSON.stringify(value))
    }
    return node
  }

  private initMindMap(): void {
    if (this.domNode.isConnected) {
      this.insertMindMapEditor()
    }
    else {
      const observer = new MutationObserver(() => {
        if (this.domNode.isConnected) {
          this.insertMindMapEditor()
          observer.disconnect()
        }
      })
      observer.observe(document.body, { childList: true, subtree: true })
    }
  }

  private insertMindMapEditor(): void {
    this.domNode.style.width = '100%'
    this.domNode.style.height = '500px'
    MindMap.usePlugin(Drag)
    this.mm = new MindMap({
      el: this.domNode,
      enableFreeDrag: false,
      mousewheelAction: 'zoom',
      disableMouseWheelZoom: true,
      data: this.data,
    } as any)
    this.createControlPanel()
    this.mm.on('node_tree_render_end', () => {
      this.data = this.mm.getData({})
      this.domNode.setAttribute('data-mm', JSON.stringify(this.data))
      this.scroll.update([], {})
    })
    if (this.mm) {
      this.mm.setData(this.data)
    }
  }

  private createControlPanel(): void {
    let isStart = true
    let isEnd = true
    const controlPanel = document.createElement('div')
    controlPanel.className = 'mindmap-control'
    const zoomOutBtn = this.createControlItem('zoomOut', '缩小', '缩小流程图', () => this.handleZoomOut())
    const zoomInBtn = this.createControlItem('zoomIn', '放大', '放大流程图', () => this.handleZoomIn())
    const resetBtn = this.createControlItem('fit', '适应', '恢复逻辑原有尺寸', () => this.handleResetZoom())
    const backBtn = this.createControlItem('back', '回退', '回退到上一步', () => {
      if (!isStart) {
        this.mm.execCommand('BACK')
      }
    })
    const forwardBtn = this.createControlItem('forward', '前进', '前进到下一步', () => {
      if (!isEnd) {
        this.mm.execCommand('FORWARD')
      }
    })

    const updateButtonState = (index: number, len: number) => {
      isStart = index <= 0
      isEnd = index >= len - 1
      backBtn.style.cursor = isStart ? 'not-allowed' : 'pointer'
      backBtn.style.opacity = isStart ? '0.5' : '1'
      forwardBtn.style.cursor = isEnd ? 'not-allowed' : 'pointer'
      forwardBtn.style.opacity = isEnd ? '0.5' : '1'
    }

    this.mm.on('back_forward', (index: number, len: number) => {
      updateButtonState(index, len)
    })
    controlPanel.append(zoomOutBtn, zoomInBtn, resetBtn, backBtn, forwardBtn)
    this.domNode.appendChild(controlPanel)
  }

  private createControlItem(iconClass: string, text: string, title: string, onClick: () => void, disabled = false) {
    const controlItem = document.createElement('div')
    controlItem.className = 'mindmap-control-item'
    controlItem.title = title
    controlItem.style.cursor = disabled ? 'not-allowed' : 'pointer'
    controlItem.style.opacity = disabled ? '0.5' : '1'

    const icon = document.createElement('i')
    icon.className = `mindmap-control-${iconClass}`

    const textSpan = document.createElement('span')
    textSpan.className = 'mindmap-control-text'
    textSpan.textContent = text

    controlItem.appendChild(icon)
    controlItem.appendChild(textSpan)

    if (!disabled) {
      controlItem.addEventListener('click', onClick)
    }

    return controlItem
  }

  private handleZoomIn(): void {
    if (this.mm && this.mm.view) {
      const containerRect = this.mm.el.getBoundingClientRect()
      const cx = containerRect.width / 2
      const cy = containerRect.height / 2
      this.mm.view.enlarge(cx, cy, false)
      this.zoomCount++
    }
  }

  private handleZoomOut(): void {
    if (this.mm && this.mm.view) {
      const containerRect = this.mm.el.getBoundingClientRect()
      const cx = containerRect.width / 2
      const cy = containerRect.height / 2
      this.mm.view.narrow(cx, cy, false)
      this.zoomCount--
    }
  }

  private handleResetZoom(): void {
    if (!this.mm || !this.mm.view || this.zoomCount === 0) return
    const containerRect = this.mm.el.getBoundingClientRect()
    const centerX = containerRect.width / 2
    const centerY = containerRect.height / 2
    const operationCount = Math.abs(this.zoomCount)
    const isEnlarge = this.zoomCount < 0
    for (let i = 0; i < operationCount; i++) {
      if (isEnlarge) {
        this.mm.view.enlarge(centerX, centerY, false)
      }
      else {
        this.mm.view.narrow(centerX, centerY, false)
      }
    }
    this.zoomCount = 0
  }

  value(): any {
    return this.data
  }
}

Quill.register(MindmapPlaceholderBlot)

export class MindModule {
  quill: Quill
  toolbar: any
  mmContainer: HTMLElement | null = null
  mm: MindMap | null = null
  tempDiv: HTMLElement | null = null

  constructor(quill: Quill, options: any) {
    this.quill = quill
    this.toolbar = quill.getModule('toolbar')
    const domNode = document.querySelector('.ql-mind')

    if (domNode) {
      domNode.addEventListener('click', () => {
        this.insertMindMapEditor()
      })
    }
  }

  private insertMindMapEditor(): void {
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
      this.quill.insertEmbed(range.index, 'mindmap-placeholder', defaultData, 'user')
      this.quill.setSelection(range.index + 1, 0)
    }
  }
}
