import type { Root } from 'parchment'
import type { BlockEmbed as TypeBlockEmbed } from 'quill/blots/block'
import LogicFlow, { } from '@logicflow/core'
import { Control, DndPanel, Menu, SelectionSelect } from '@logicflow/extension'

import Quill from 'quill'
import '@logicflow/core/lib/style/index.css'
import '@logicflow/extension/lib/style/index.css'

const BlockEmbed = Quill.import('blots/embed') as typeof TypeBlockEmbed
// 定义 flowchart-placeholder blot
class FlowchartBlot extends BlockEmbed {
  static blotName = 'flowchart'
  static tagName = 'div'
  static className = 'ql-flowchart'
  private lf: LogicFlow | null = null
  private data: any

  constructor(scroll: Root, domNode: HTMLElement) {
    super(scroll, domNode)
    this.domNode.classList.add('ql-flowchart-container')
    this.domNode.style.height = '500px'
    this.domNode.style.border = '1px solid #e8e8e8'
    this.domNode.style.margin = '10px 0'
    this.data = FlowchartBlot.value(this.domNode)
    this.initLogicFlow()
  }

  static value(domNode: HTMLElement): any {
    const dataStr = JSON.parse(domNode.getAttribute('data-flow'))
    return dataStr.root ? dataStr.root : dataStr
  }

  static create(value: any): HTMLElement {
    const node = super.create() as HTMLElement
    if (value) {
      node.setAttribute('data-flow', JSON.stringify(value))
    }
    return node
  }

  /**
   * 初始化LogicFlow实例
   */
  private initLogicFlow(): void {
    // 确保DOM已挂载
    if (this.domNode.isConnected) {
      this.insertLogicFlowInstance()
    }
    else {
      // 如果尚未挂载，则监听挂载事件
      const observer = new MutationObserver(() => {
        if (this.domNode.isConnected) {
          this.insertLogicFlowInstance()
          observer.disconnect()
        }
      })
      observer.observe(document.body, { childList: true, subtree: true })
    }
  }

  private insertLogicFlowInstance(): void {
    this.domNode.style.width = '100%'
    this.domNode.style.height = '100%'
    this.lf = new LogicFlow({
      container: this.domNode,
      stopScrollGraph: true,
      stopZoomGraph: true,
      allowResize: true,
      allowRotate: true,
      editable: true,
      height: 500,
      grid: {
        type: 'dot',
        size: 20,
      },
      plugins: [DndPanel, SelectionSelect, Control, Menu],
    })
    const self = this
    this.lf.addMenuConfig({
      nodeMenu: [
        {
          text: '删除文本',
          callback(node: any) {
            self.lf.updateText(node.id, '')
          },
        },
      ],
      edgeMenu: [
        {
          text: '删除文本',
          callback(node: any) {
            self.lf.updateText(node.id, '')
          },
        },
      ],
    });
    (this.lf.extension.dndPanel as any).setPatternItems([
      {
        label: '选区',
        icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAAH6ji2bAAAABGdBTUEAALGPC/xhBQAAAOVJREFUOBGtVMENwzAIjKP++2026ETdpv10iy7WFbqFyyW6GBywLCv5gI+Dw2Bluj1znuSjhb99Gkn6QILDY2imo60p8nsnc9bEo3+QJ+AKHfMdZHnl78wyTnyHZD53Zzx73MRSgYvnqgCUHj6gwdck7Zsp1VOrz0Uz8NbKunzAW+Gu4fYW28bUYutYlzSa7B84Fh7d1kjLwhcSdYAYrdkMQVpsBr5XgDGuXwQfQr0y9zwLda+DUYXLaGKdd2ZTtvbolaO87pdo24hP7ov16N0zArH1ur3iwJpXxm+v7oAJNR4JEP8DoAuSFEkYH7cAAAAASUVORK5CYII=',
        callback: () => {
          (this.lf.extension.selectionSelect as any).openSelectionSelect()
          this.lf.once('selection:selected', () => {
            (this.lf.extension.selectionSelect as any).closeSelectionSelect()
          })
        },
      },
      {
        type: 'circle',
        text: '圆形',
        label: '圆形',
        icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAAH6ji2bAAAABGdBTUEAALGPC/xhBQAAAnBJREFUOBGdVL1rU1EcPfdGBddmaZLiEhdx1MHZQXApraCzQ7GKLgoRBxMfcRELuihWKcXFRcEWF8HBf0DdDCKYRZpnl7p0svLe9Zzbd29eQhTbC8nv+9zf130AT63jvooOGS8Vf9Nt5zxba7sXQwODfkWpkbjTQfCGUd9gIp3uuPP8bZ946g56dYQvnBg+b1HB8VIQmMFrazKcKSvFW2dQTxJnJdQ77urmXWOMBCmXM2Rke4S7UAW+/8ywwFoewmBps2tu7mbTdp8VMOkIRAkKfrVawalJTtIliclFbaOBqa0M2xImHeVIfd/nKAfVq/LGnPss5Kh00VEdSzfwnBXPUpmykNss4lUI9C1ga+8PNrBD5YeqRY2Zz8PhjooIbfJXjowvQJBqkmEkVnktWhwu2SM7SMx7Cj0N9IC0oQXRo8xwAGzQms+xrB/nNSUWVveI48ayrFGyC2+E2C+aWrZHXvOuz+CiV6iycWe1Rd1Q6+QUG07nb5SbPrL4426d+9E1axKjY3AoRrlEeSQo2Eu0T6BWAAr6COhTcWjRaYfKG5csnvytvUr/WY4rrPMB53Uo7jZRjXaG6/CFfNMaXEu75nG47X+oepU7PKJvvzGDY1YLSKHJrK7vFUwXKkaxwhCW3u+sDFMVrIju54RYYbFKpALZAo7sB6wcKyyrd+aBMryMT2gPyD6GsQoRFkGHr14TthZni9ck0z+Pnmee460mHXbRAypKNy3nuMdrWgVKj8YVV8E7PSzp1BZ9SJnJAsXdryw/h5ctboUVi4AFiCd+lQaYMw5z3LGTBKjLQOeUF35k89f58Vv/tGh+l+PE/wG0rgfIUbZK5AAAAABJRU5ErkJggg==',
      },
      {
        type: 'rect',
        text: '矩形',
        label: '矩形',
        icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABMAAAATCAYAAAEFVwZaAAAABGdBTUEAALGPC/xhBQAAAqlJREFUOBF9VM9rE0EUfrMJNUKLihGbpLGtaCOIR8VjQMGDePCgCCIiCNqzCAp2MyYUCXhUtF5E0D+g1t48qAd7CCLqQUQKEWkStcEfVGlLdp/fm3aW2QQdyLzf33zz5m2IsAZ9XhDpyaaIZkTS4ASzK41TFao88GuJ3hsr2pAbipHxuSYyKRugagICGANkfFnNh3HeE2N0b3nN2cgnpcictw5veJIzxmDamSlxxQZicq/mflxhbaH8BLRbuRwNtZp0JAhoplVRUdzmCe/vO27wFuuA3S5qXruGdboy5/PRGFsbFGKo/haRtQHIrM83bVeTrOgNhZReWaYGnE4aUQgTJNvijJFF4jQ8BxJE5xfKatZWmZcTQ+BVgh7s8SgPlCkcec4mGTmieTP4xd7PcpIEg1TX6gdeLW8rTVMVLVvb7ctXoH0Cydl2QOPJBG21STE5OsnbweVYzAnD3A7PVILuY0yiiyDwSm2g441r6rMSgp6iK42yqroI2QoXeJVeA+YeZSa47gZdXaZWQKTrG93rukk/l2Al6Kzh5AZEl7dDQy+JjgFahQjRopSxPbrbvK7GRe9ePWBo1wcU7sYrFZtavXALwGw/7Dnc50urrHJuTPSoO2IMV3gUQGNg87IbSOIY9BpiT9HV7FCZ94nPXb3MSnwHn/FFFE1vG6DTby+r31KAkUktB3Qf6ikUPWxW1BkXSPQeMHHiW0+HAd2GelJsZz1OJegCxqzl+CLVHa/IibuHeJ1HAKzhuDR+ymNaRFM+4jU6UWKXorRmbyqkq/D76FffevwdCp+jN3UAN/C9JRVTDuOxC/oh+EdMnqIOrlYteKSfadVRGLJFJPSB/ti/6K8f0CNymg/iH2gO/f0DwE0yjAFO6l8JaR5j0VPwPwfaYHqOqrCI319WzwhwzNW/aQAAAABJRU5ErkJggg==',
      },
      {
        type: 'ellipse',
        text: '椭圆',
        label: '椭圆',
        icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABMAAAATCAYAAAEFVwZaAAAABGdBTUEAALGPC/xhBQAAAqlJREFUOBF9VM9rE0EUfrMJNUKLihGbpLGtaCOIR8VjQMGDePCgCCIiCNqzCAp2MyYUCXhUtF5E0D+g1t48qAd7CCLqQUQKEWkStcEfVGlLdp/fm3aW2QQdyLzf33zz5m2IsAZ9XhDpyaaIZkTS4ASzK41TFao88GuJ3hsr2pAbipHxuSYyKRugagICGANkfFnNh3HeE2N0b3nN2cgnpcictw5veJIzxmDamSlxxQZicq/mflxhbaH8BLRbuRwNtZp0JAhoplVRUdzmCe/vO27wFuuA3S5qXruGdboy5/PRGFsbFGKo/haRtQHIrM83bVeTrOgNhZReWaYGnE4aUQgTJNvijJFF4jQ8BxJE5xfKatZWmZcTQ+BVgh7s8SgPlCkcec4mGTmieTP4xd7PcpIEg1TX6gdeLW8rTVMVLVvb7ctXoH0Cydl2QOPJBG21STE5OsnbweVYzAnD3A7PVILuY0yiiyDwSm2g441r6rMSgp6iK42yqroI2QoXeJVeA+YeZSa47gZdXaZWQKTrG93rukk/l2Al6Kzh5AZEl7dDQy+JjgFahQjRopSxPbrbvK7GRe9ePWBo1wcU7sYrFZtavXALwGw/7Dnc50urrHJuTPSoO2IMV3gUQGNg87IbSOIY9BpiT9HV7FCZ94nPXb3MSnwHn/FFFE1vG6DTby+r31KAkUktB3Qf6ikUPWxW1BkXSPQeMHHiW0+HAd2GelJsZz1OJegCxqzl+CLVHa/IibuHeJ1HAKzhuDR+ymNaRFM+4jU6UWKXorRmbyqkq/D76FffevwdCp+jN3UAN/C9JRVTDuOxC/oh+EdMnqIOrlYteKSfadVRGLJFJPSB/ti/6K8f0CNymg/iH2gO/f0DwE0yjAFO6l8JaR5j0VPwPwfaYHqOqrCI319WzwhwzNW/aQAAAABJRU5ErkJggg==',
      },
      {
        type: 'diamond',
        text: '菱形',
        label: '菱形',
        icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABUAAAAVCAYAAAHeEJUAAAAABGdBTUEAALGPC/xhBQAAAvVJREFUOBGNVEFrE0EU/mY3bQoiFlOkaUJrQUQoWMGePLX24EH0IIoHKQiCV0G8iE1covgLiqA/QTzVm1JPogc9tIJYFaQtlhQxqYjSpunu+L7JvmUTU3AgmTfvffPNN++9WSA1DO182f6xwILzD5btfAoQmwL5KJEwiQyVbSVZ0IgRyV6PTpIJ81E5ZvqfHQR0HUOBHW4L5Et2kQ6Zf7iAOhTFAA8s0pEP7AXO1uAA52SbqGk6h/6J45LaLhO64ByfcUzM39V7ZiAdS2yCePPEIQYvTUHqM/n7dgQNfBKWPjpF4ISk8q3J4nB11qw6X8l+FsF3EhlkEMfrjIer3wJTLwS2aCNcj4DbGxXTw00JmAuO+Ni6bBxVUCvS5d9aa04+so4pHW5jLTywuXAL7jJ+D06sl82Sgl2JuVBQn498zkc2bGKxULHjCnSMadBKYDYYHAtsby1EQ5lNGrQd4Y3v4Zo0XdGEmDno46yCM9Tk+RiJmUYHS/aXHPNTcjxcbTFna000PFJHIVZ5lFRqRpJWk9/+QtlOUYJj9HG5pVFEU7zqIYDVsw2s+AJaD8wTd2umgSCCyUxgGsS1Y6TBwXQQTFuZaHcd8gAGioE90hlsY+wMcs30RduYtxanjMGal8H5dMW67dmT1JFtYUEe8LiQLRsPZ6IIc7A4J5tqco3T0pnv/4u0kyzrYUq7gASuEyI8VXKvB9Odytv6jS/PNaZBln0nioJG/AVQRZvApOdhjj3Jt8QC8Im09SafwdBdvIpztpxWxpeKCC+EsFdS8DCyuCn2munFpL7ctHKp+Xc5cMybeIyMAN33SPL3ZR9QV1XVwLyzHm6Iv0/yeUuUb7PPlZC4D4HZkeu6dpF4v9j9MreGtMbxMMRLIcjJic9yHi7WQ3yVKzZVWUr5UrViJvn1FfUlwe/KYVfYyWRLSGNu16hR01U9IacajXPei0wx/5BqgInvJN+MMNtNme7ReU9SBbgntovn0kKHpFg7UogZvaZiOue/q1SBo9ktHzQAAAAASUVORK5CYII=',
      },
    ])

    let timer = null
    let content = ''
    let id = ''
    this.lf.render(this.data)
    this.lf.on('node:dbclick', (data) => {
      id = data.data.id
      timer = setInterval(() => {
        const textInputElement = document.querySelector('.lf-text-input')
        if (textInputElement) {
          content = textInputElement.textContent || ''
        }
      }, 100)
    })
    this.lf.on('edge:dbclick', (data) => {
      id = data.data.id
      timer = setInterval(() => {
        const textInputElement = document.querySelector('.lf-text-input')
        if (textInputElement) {
          content = textInputElement.textContent || ''
        }
      }, 100)
    })

    this.lf.on('blank:mousedown', () => {
      timer && clearInterval(timer)
      this.lf.updateText(id, content)
      content = ''
      id = ''
    })

    this.lf.on('graph:updated', () => {
      this.data = this.lf.getGraphData()
      this.domNode.setAttribute('data-flow', JSON.stringify(this.data))
      this.scroll.update([], {})
    })
  }
}

Quill.register(FlowchartBlot)

export class FlowchartModule {
  quill: Quill
  toolbar: any
  lfContainer: HTMLElement | null = null
  lf: LogicFlow | null = null
  tempDiv: HTMLElement | null = null

  constructor(quill: Quill, options: any) {
    this.quill = quill
    this.toolbar = quill.getModule('toolbar')
    const domNode = document.querySelector('.ql-flow-chart')

    if (domNode) {
      domNode.addEventListener('click', () => {
        this.insertFlowChartEditor()
      })
    }
  }

  private insertFlowChartEditor(): void {
    const range = this.quill.getSelection()
    if (range) {
      const defaultData = {
        nodes: [
          { id: 'node1', type: 'rect', x: 100, y: 150, text: '开始' },
          { id: 'node2', type: 'rect', x: 300, y: 150, text: '结束' },
        ],
        edges: [
          { id: 'edge1', sourceNodeId: 'node1', targetNodeId: 'node2', type: 'polyline' },
        ],
      }
      this.quill.insertEmbed(range.index, 'flowchart', defaultData, 'user')
      this.quill.setSelection(range.index + 1, 0)
    }
  }
}
