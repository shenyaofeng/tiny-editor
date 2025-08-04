import { FontStyle, LineHeightStyle, SizeStyle, TextIndentStyle } from './attributors'
import { EN_US } from './config/i18n/en-us'
import { ZH_CN } from './config/i18n/zh-cn'
import FluentEditor from './core/fluent-editor'
import { EmojiBlot, SoftBreak, StrikeBlot, Video } from './formats'
import Counter from './modules/counter' // 字符统计
import { CustomClipboard } from './modules/custom-clipboard' // 粘贴板
import { BlotFormatter } from './modules/custom-image' // 图片
import { FileUploader } from './modules/custom-uploader' // 上传
import { DividerBlot } from './modules/divider' // 分割线
import { EmojiModule } from './modules/emoji'
import { FileModule } from './modules/file' // 文件
<<<<<<< HEAD
<<<<<<< HEAD
import { FlowChartModule } from './modules/flow-chart' // 流程图
=======
import { FlowchartModule } from './modules/flowchart'
>>>>>>> 61664d6 (feat: add insert flowChart and mindChart)
=======
>>>>>>> 3895259 (fix:node content delete)
import I18N from './modules/i18n'
import { LinkBlot } from './modules/link' // 超链接
import { MathliveModule } from './modules/mathlive' // latex公式
import { Mention } from './modules/mention' // @提醒
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
import { MindMapModule } from './modules/mind-map' // 思维导图
=======
import { MindModule } from './modules/mind/index' // 思维导图
>>>>>>> ef86d9a (fix(mind): 调整思维导图文件结构)
=======
import { MindModule } from './modules/mind-map' // 思维导图
>>>>>>> ad38183 (fix(mind-map):更新模块名称与将国际化和样式放入mind-map文件夹中)
=======
import { MindMapModule } from './modules/mind-map' // 思维导图
>>>>>>> 9450055 (fix(mind-map):规范思维导图相关变量名称)
import { ShortCutKey } from './modules/shortcut-key'
import Syntax from './modules/syntax' // 代码块高亮
import { BetterToolbar } from './modules/toolbar' // 工具栏
import { ColorPicker, Picker } from './modules/toolbar/better-picker'
import SnowTheme from './themes/snow'
import Icons from './ui/icons'

I18N.register(
  {
    'en-US': EN_US,
    'zh-CN': ZH_CN,
  },
  true,
)
FluentEditor.register(
  {
    'attributors/style/font': FontStyle,
    'attributors/style/size': SizeStyle,
    'attributors/style/line-height': LineHeightStyle,

    'formats/font': FontStyle,
    'formats/line-height': LineHeightStyle,
    'formats/size': SizeStyle,
    'formats/emoji': EmojiBlot,
    'formats/softBreak': SoftBreak,
    'formats/strike': StrikeBlot,
    'formats/text-indent': TextIndentStyle,
    'formats/video': Video,
    'formats/divider': DividerBlot,
    'formats/link': LinkBlot,

    'modules/clipboard': CustomClipboard,
    'modules/counter': Counter,
    'modules/emoji': EmojiModule,
    'modules/file': FileModule,
    'modules/i18n': I18N,
    'modules/image': BlotFormatter,
    'modules/mathlive': MathliveModule,
    'modules/mention': Mention,
    'modules/syntax': Syntax,
    'modules/toolbar': BetterToolbar,
    'modules/uploader': FileUploader,
    'modules/shortcut-key': ShortCutKey,
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
    'modules/mind-map': MindMapModule,
<<<<<<< HEAD
    'modules/flow-chart': FlowChartModule,
=======
=======
    'modules/flow': FlowchartModule,
=======
>>>>>>> 2f4d886 (fix:node content delete)
    'modules/mind': MindModule,
>>>>>>> d9b8b61 (feat: add insert flowChart and mindChart)
<<<<<<< HEAD
>>>>>>> 61664d6 (feat: add insert flowChart and mindChart)
=======
=======
    'modules/flow-chart': FlowchartModule,
>>>>>>> ce33623 (feature(flow-chart):流程图)
<<<<<<< HEAD
>>>>>>> 1be5b5c (feature(flow-chart):流程图)
=======
=======
    'modules/mind-map': MindModule,
>>>>>>> ad38183 (fix(mind-map):更新模块名称与将国际化和样式放入mind-map文件夹中)
<<<<<<< HEAD
>>>>>>> 7ccbb9c (fix(mind-map):更新模块名称与将国际化和样式放入mind-map文件夹中)
=======
=======
    'modules/mind-map': MindMapModule,
>>>>>>> 9450055 (fix(mind-map):规范思维导图相关变量名称)
>>>>>>> e23748b (fix(mind-map):规范思维导图相关变量名称)

    'themes/snow': SnowTheme,

    'ui/icons': Icons,
    'ui/picker': Picker,
    'ui/color-picker': ColorPicker,
  },
  true, // 覆盖内部模块
)

export default FluentEditor
