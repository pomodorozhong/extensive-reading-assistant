import type { CefrLevel, Story } from '../types.ts'

// Original illustrative articles for debugging, not certified CEFR reading material.
const articles: Array<{ level: CefrLevel; title: string; body: string }> = [
  {
    level: 'A1',
    title: 'A small garden',
    body: `I live in a small town. There is a garden near my home. I go there with my friend on Saturday. We take water and some food.

The garden has trees and flowers. A cat sits under a tree. My friend likes the red flowers. I like the yellow flowers. We sit and eat. The sun is warm, and we are happy.

After lunch, we help a woman in the garden. We give the flowers water. Then we walk home. I want to go to the garden again.`,
  },
  {
    level: 'A2',
    title: 'A Saturday adventure',
    body: `Last Saturday, my sister and I visited a garden near the station. We wanted a little adventure, so we took a different road from our usual one. We arrived early and met a friendly man at the gate.

He showed us the vegetables and explained how to look after them. Some plants needed more water than others. My sister carried a small bucket, while I picked up leaves from the path. We worked for an hour and then had a break.

During lunch, we talked to two people who lived nearby. They invited us to come back next weekend. We were tired when we got home, but we felt pleased. Our town had a new place where we could learn something and make friends.`,
  },
  {
    level: 'B1',
    title: 'Keeping the garden open',
    body: `When our local garden lost its main volunteer, several neighbours thought we should abandon the project. The paths were becoming difficult to use, and nobody knew who would pay for new tools. I understood their concerns, but I believed the garden was worth keeping.

At a meeting, I suggested that we share the work instead of expecting one person to do everything. Each family could choose a small task. People who were busy during the week could help on Sunday, while others could water the plants in the evening.

The plan did not solve every problem immediately. However, after a month, the garden looked much better. We also discovered that working together gave us a reason to talk to neighbours we had never met. The project became more than a place to grow food. It helped us feel part of the community.`,
  },
  {
    level: 'B2',
    title: 'Who should the garden serve?',
    body: `A proposal to expand the community garden prompted a lively debate. Supporters argued that additional space would allow more residents to grow vegetables and provide useful accommodation for visiting volunteers. Opponents questioned whether the project justified the expense, particularly when other public facilities needed repairs.

The committee initially treated the disagreement as a choice between growth and decline. Yet the complexity of the situation became clearer when residents described how they actually used the garden. Some valued its educational activities; others simply wanted a quiet place to sit. An expansion designed around food production alone might overlook both groups.

Rather than approve the original proposal, the committee agreed to run a temporary trial. A small unused area would become a shared space for workshops and informal visits. Attendance and feedback would be recorded over the summer. This approach offered a practical way to test assumptions before making a substantial commitment.`,
  },
  {
    level: 'C1',
    title: 'The value of a shared place',
    body: `Few residents would concur with the claim that a community garden can be evaluated solely by the quantity of food it produces. Nevertheless, discussions about its funding repeatedly return to measurable output, as though the relationships cultivated there were merely incidental benefits.

This tendency reflects a broader difficulty in assessing shared public spaces. Their most significant contribution may be the gradual formation of trust among people whose lives would otherwise remain separate. Such trust is neither automatic nor evenly distributed. A welcoming exterior can conceal routines that make newcomers feel reluctant to participate.

The garden committee therefore needs to examine not only attendance but also the conditions under which participation becomes possible. Flexible hours, clear responsibilities, and opportunities to influence decisions may matter more than another promotional campaign. These measures will not eliminate disagreement. They can, however, make disagreement productive by ensuring that residents regard the garden as a shared undertaking rather than a service delivered to them.`,
  },
  {
    level: 'C2',
    title: 'What a garden cannot measure',
    body: `The apparent tranquillity of a communal garden belies the negotiations that sustain it. Every allocation of space expresses a tacit judgement about whose needs deserve priority, while the language of collective ownership can obscure an unequal distribution of labour. To describe the garden as an uncomplicated success is therefore to mistake its agreeable appearance for an absence of tension.

Its pleasures are often ephemeral: a conversation interrupted by rain, a brief display of flowers, the satisfaction of finding that an unfamiliar neighbour has quietly repaired a broken gate. Their transience does not render them trivial. Rather, it exposes the inadequacy of an assessment that recognises only durable, countable outcomes.

A more discerning account would acknowledge the garden's contradictions without allowing them to eclipse its value. Participation can be both generous and self-interested; established routines can offer reassurance while discouraging innovation. The task is not to resolve these ambiguities once and for all, but to preserve a setting in which they can be negotiated. The garden endures through that continuing, occasionally fractious conversation.`,
  },
]

export const DEBUG_FIXTURES: readonly Story[] = articles.map((article) => ({
  ...article,
  id: `debug-cefr-${article.level.toLowerCase()}`,
  theme: 'Community garden · debugging fixture',
  createdAt: '2026-10-01T00:00:00.000Z',
  wordMarks: {},
  explanations: {},
}))

export function isDebugFixture(id: string): boolean {
  return DEBUG_FIXTURES.some((story) => story.id === id)
}
