<script setup lang="ts">
import type FluentEditor from '@opentiny/fluent-editor'
import { onMounted, ref } from 'vue'

let editor: FluentEditor
const editorRef3 = ref<HTMLElement>()

const TOOLBAR_CONFIG = [
  [{ header: [] }],
  ['bold', 'italic', 'underline', 'link'],
  [{ list: 'ordered' }, { list: 'bullet' }],
  [{ align: [] }, { list: 'ordered' }, { list: 'bullet' }, { list: 'check' }],
  ['clean'],
  ['flow-chart'],
]

onMounted(() => {
  import('@opentiny/fluent-editor').then(({ default: FluentEditor }) => {
    if (!editorRef3.value) return
    editor = new FluentEditor(editorRef3.value, {
      theme: 'snow',
      modules: {
        'toolbar': TOOLBAR_CONFIG,
        'flow-chart': {
          resize: true,
        },
      },
    })
  })
})
</script>

<template>
  <div ref="editorRef3" />
</template>
