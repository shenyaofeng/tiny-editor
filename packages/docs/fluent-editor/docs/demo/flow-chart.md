# 流程图

TinyEditor 的流程图功能依赖 `LogicFlow` ，使用前请先安装 `LogicFlow` 相关依赖。

```bash
npm install @logicflow/core @logicflow/extension
```

## 网格和背景配置

流程图模块支持配置网格，通过 `flow-chart` 模块的配置项可以自定义这些设置。

:::demo src=demos/flow-chart-grid.vue
:::

## 背景配置

流程图模块支持配置背景，通过 `flow-chart` 模块的配置项可以自定义这些设置。

:::demo src=demos/flow-chart-background.vue
:::

## 调整大小

流程图模块支持调整流程图的大小，流程图拖动调整手柄可以改变流程图的尺寸。

<!-- :::demo src=demos/flow-chart-resize.vue
::: -->

## 配置

### modules['flow-chart'].grid

| 属性             | 类型              | 说明                                       | 默认值  |
| ---------------- | ----------------- | ------------------------------------------ | ------- |
| size             | `number`          | 网格大小                                   | 20      |
| visible          | `boolean`         | 是否显示网格                               | true    |
| type             | `'dot' \| 'mesh'` | 网格类型，可选 'dot'(点状) 或 'mesh'(线状) | 'dot'   |
| config.color     | `string`          | 网格颜色配置                               | #ababab |
| config.thickness | `number`          | 网格线宽                                   | 1       |

### modules['flow-chart'].background

| 属性     | 类型                                                  | 说明                                       | 默认值   |
| -------- | ----------------------------------------------------- | ------------------------------------------ | -------- |
| color    | `string`                                              | 背景颜色                                   | -        |
| image    | `string`                                              | 背景图片 URL                               | -        |
| repeat   | `'repeat' \| 'repeat-x' \| 'repeat-y' \| 'no-repeat'` | 背景图片重复方式                           | 'repeat' |
| position | `string`                                              | 背景图片位置（CSS background-position 值） | 'center' |
| size     | `string`                                              | 背景图片大小（CSS background-size 值）     | 'auto'   |
| opacity  | `number`                                              | 背景透明度，取值范围 0-1                   | 1        |

### modules['flow-chart'].resize

| 属性   | 类型      | 说明                   | 默认值 |
| ------ | --------- | ---------------------- | ------ |
| resize | `boolean` | 是否允许调整流程图大小 | false  |
