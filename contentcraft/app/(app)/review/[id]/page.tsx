import { prisma } from '@/lib/db/client'
import { requireRole } from '@/lib/auth'
import { notFound } from 'next/navigation'
import ReviewScriptClient from './ReviewScriptClient'

export default async function ReviewScriptPage({ params }: { params: { id: string } }) {
  const session = await requireRole('REVIEWER', 'ADMIN')

  const script = await prisma.generatedScript.findUnique({
    where: { id: params.id },
    include: {
      run: {
        include: { researchBrief: true },
      },
      reviewFeedback: {
        include: { reviewer: { select: { name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!script) notFound()

  return (
    <ReviewScriptClient
      script={script as any}
      reviewerId={session.user.id}
    />
  )
}
