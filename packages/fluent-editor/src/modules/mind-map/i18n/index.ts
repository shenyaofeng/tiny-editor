import { MIND_EN_US } from './en-us'
import { MIND_ZH_CN } from './zh-cn'

export function registerMindI18N(I18N: any) {
  I18N.register({
    'en-US': MIND_EN_US,
    'zh-CN': MIND_ZH_CN,
  }, false)
}
