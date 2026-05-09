import puppeteer from 'puppeteer-core'
import { profileRepo, runRepo, scenarioRepo } from '@main/db'
import { getRunning, isRunning, launchProfile } from '@main/browser/launcher'
import type { AutomationRun, AutomationStep } from '@shared/types'

export type RunEmitter = (run: AutomationRun) => void

/**
 * Execute an automation scenario against a profile.
 * Auto-launches the profile if it isn't running.
 */
export async function runScenario(
  scenarioId: string,
  profileId: string,
  emit: RunEmitter,
  onProfileStatus: (id: string, status: 'running' | 'idle' | 'error', err?: string) => void
): Promise<AutomationRun> {
  const scenario = scenarioRepo.list().find((s) => s.id === scenarioId)
  const profile = profileRepo.get(profileId)
  if (!scenario) throw new Error('scenario not found')
  if (!profile) throw new Error('profile not found')

  let run = runRepo.create({
    scenarioId,
    profileId,
    status: 'running',
    log: ['[init] launching profile if not running']
  })
  emit(run)

  try {
    if (!isRunning(profileId)) {
      const r = await launchProfile(profileId, onProfileStatus)
      if (!r.ok || !r.cdpEndpoint) throw new Error(r.error ?? 'failed to launch profile')
      // Give Chrome a beat to settle
      await new Promise((res) => setTimeout(res, 1000))
    }
    const running = getRunning(profileId)
    if (!running) throw new Error('profile not running after launch')

    const browser = await puppeteer.connect({
      browserURL: running.cdpEndpoint,
      defaultViewport: null
    })
    const pages = await browser.pages()
    const page = pages[0] ?? (await browser.newPage())

    for (let i = 0; i < scenario.steps.length; i++) {
      const step = scenario.steps[i]
      const log = `[${i + 1}/${scenario.steps.length}] ${step.type}`
      run.log.push(log)
      runRepo.update(run.id, { log: run.log })
      emit(run)
      await executeStep(page, step)
    }

    await browser.disconnect()

    run.status = 'success'
    run.endedAt = new Date().toISOString()
    runRepo.update(run.id, run)
    emit(run)
    return run
  } catch (e: any) {
    run.status = 'failed'
    run.error = e?.message ?? String(e)
    run.endedAt = new Date().toISOString()
    run.log.push(`[error] ${run.error}`)
    runRepo.update(run.id, run)
    emit(run)
    return run
  }
}

async function executeStep(page: any, step: AutomationStep): Promise<void> {
  switch (step.type) {
    case 'goto':
      await page.goto(step.url, { waitUntil: 'domcontentloaded', timeout: 60000 })
      break
    case 'wait':
      await new Promise((r) => setTimeout(r, step.ms))
      break
    case 'waitForSelector':
      await page.waitForSelector(step.selector, { timeout: step.timeoutMs ?? 30000 })
      break
    case 'click':
      await page.click(step.selector)
      break
    case 'type':
      await page.type(step.selector, step.text, { delay: step.delay ?? 30 })
      break
    case 'press':
      await page.keyboard.press(step.key)
      break
    case 'evaluate':
      await page.evaluate(new Function(step.script))
      break
    case 'screenshot':
      await page.screenshot({ path: step.path, fullPage: true })
      break
    case 'scroll':
      await page.evaluate(
        new Function('x', 'y', 'window.scrollBy(x, y)') as any,
        step.x ?? 0,
        step.y ?? 600
      )
      break
    default: {
      const _exhaustive: never = step
      void _exhaustive
    }
  }
}
