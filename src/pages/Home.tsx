import { Badge, Card, Container, Grid, Heading, Text } from '@radix-ui/themes'
import { Link } from 'react-router-dom'
import { loadSettings } from '../lib/storage'

export function Home() {
  const settings = loadSettings()

  return (
    <Container size="3" px="4">
      <Heading size="7" mb="2">
        Read more, look up less
      </Heading>
      <Text as="p" color="gray" size="3" mb="5">
        Generate stories at your level and mark words as you read. Current level:{' '}
        <Badge color="blue">{settings.cefrLevel}</Badge>
      </Text>

      <Grid columns={{ initial: '1', sm: '3' }} gap="4">
        <Card asChild>
          <Link to="/new" className="card-link">
            <Heading size="4" mb="2">
              New Story
            </Heading>
            <Text as="p" color="gray" size="2">
              Generate a story matched to your CEFR level.
            </Text>
          </Link>
        </Card>

        <Card asChild>
          <Link to="/stories" className="card-link">
            <Heading size="4" mb="2">
              My Stories
            </Heading>
            <Text as="p" color="gray" size="2">
              Open a story you have already generated.
            </Text>
          </Link>
        </Card>

        <Card asChild>
          <Link to="/settings" className="card-link">
            <Heading size="4" mb="2">
              Settings
            </Heading>
            <Text as="p" color="gray" size="2">
              Set your vocabulary level and API key.
            </Text>
          </Link>
        </Card>
      </Grid>
    </Container>
  )
}
