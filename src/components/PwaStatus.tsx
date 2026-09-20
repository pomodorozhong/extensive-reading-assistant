import { Button, Flex, Text } from '@radix-ui/themes'
import { useRegisterSW } from 'virtual:pwa-register/react'

export function PwaStatus() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({ immediate: true })

  function dismiss() {
    setOfflineReady(false)
    setNeedRefresh(false)
  }

  if (!offlineReady && !needRefresh) {
    return null
  }

  return (
    <div className="pwa-status" role="status" aria-live="polite">
      <Flex direction="column" gap="2">
        <Text size="2">
          {offlineReady
            ? 'Offline reading is ready on this device.'
            : 'A new version is ready. Reload to update the app.'}
        </Text>
        <Flex justify="end" gap="2">
          {needRefresh ? (
            <Button size="1" onClick={() => void updateServiceWorker(true)}>
              Reload
            </Button>
          ) : (
            <Button size="1" variant="soft" onClick={dismiss}>
              Dismiss
            </Button>
          )}
        </Flex>
      </Flex>
    </div>
  )
}
