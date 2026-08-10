'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { BarChart3, Users, CheckCircle2 } from 'lucide-react'

interface PollOption {
  id: string
  option_text: string
  option_order: number
  vote_count?: number
}

interface Poll {
  id: string
  title: string
  description: string | null
  poll_type: string
  file_url: string | null
  file_type: string | null
  created_at: string
  expires_at: string | null
  is_active: boolean
}

export default function PollDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const [poll, setPoll] = useState<Poll | null>(null)
  const [options, setOptions] = useState<PollOption[]>([])
  const [selectedOptions, setSelectedOptions] = useState<string[]>([])
  const [hasVoted, setHasVoted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchPoll()
    checkIfVoted()
  }, [params.id, user])

  async function fetchPoll() {
    try {
      const { data: pollData, error: pollError } = await supabase
        .from('polls')
        .select('*')
        .eq('id', params.id)
        .single()

      if (pollError) throw pollError

      setPoll(pollData)

      const { data: optionsData, error: optionsError } = await supabase
        .from('poll_options')
        .select(`
          *,
          votes(count)
        `)
        .eq('poll_id', params.id)
        .order('option_order', { ascending: true })

      if (optionsError) throw optionsError

      const optionsWithVoteCount = optionsData?.map((opt: any) => ({
        ...opt,
        vote_count: opt.votes?.[0]?.count || 0,
      })) || []

      setOptions(optionsWithVoteCount)
    } catch (error: any) {
      setError(error.message || 'Failed to fetch poll')
    } finally {
      setLoading(false)
    }
  }

  async function checkIfVoted() {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('votes')
        .select('id')
        .eq('poll_id', params.id)
        .eq('user_id', user.id)
        .limit(1)

      if (error) throw error

      setHasVoted(data && data.length > 0)
    } catch (error: any) {
      console.error('Error checking vote status:', error)
    }
  }

  const handleOptionToggle = (optionId: string) => {
    if (poll?.poll_type === 'single') {
      setSelectedOptions([optionId])
    } else {
      setSelectedOptions((prev) =>
        prev.includes(optionId)
          ? prev.filter((id) => id !== optionId)
          : [...prev, optionId]
      )
    }
  }

  const handleSubmitVote = async () => {
    if (selectedOptions.length === 0) {
      setError('Please select at least one option')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const votesToInsert = selectedOptions.map((optionId) => ({
        poll_id: params.id,
        option_id: optionId,
        user_id: user?.id,
      }))

      const { error } = await supabase
        .from('votes')
        .insert(votesToInsert)

      if (error) throw error

      setHasVoted(true)
      fetchPoll() // Refresh to show updated vote counts
    } catch (error: any) {
      setError(error.message || 'Failed to submit vote')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  if (!poll) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="py-12 text-center">
            <p className="text-gray-600">Poll not found</p>
            <Button onClick={() => router.push('/dashboard')} className="mt-4">
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const totalVotes = options.reduce((sum, opt) => sum + (opt.vote_count || 0), 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-4xl mx-auto px-4 py-8">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {hasVoted && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              You have already voted on this poll
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <CardTitle className="text-2xl mb-2">{poll.title}</CardTitle>
                {poll.description && (
                  <CardDescription className="text-base">{poll.description}</CardDescription>
                )}
              </div>
              <Badge variant={poll.poll_type === 'single' ? 'default' : 'secondary'}>
                {poll.poll_type === 'single' ? 'Single Choice' : 'Multiple Choice'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {poll.file_url && (
              <div>
                {poll.file_type === 'image' ? (
                  <img
                    src={poll.file_url}
                    alt="Poll attachment"
                    className="w-full h-64 object-cover rounded-md"
                  />
                ) : (
                  <a
                    href={poll.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    View attached file
                  </a>
                )}
              </div>
            )}

            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Options</h3>
              {options.map((option) => {
                const percentage = totalVotes > 0
                  ? ((option.vote_count || 0) / totalVotes * 100).toFixed(1)
                  : '0'

                return (
                  <div
                    key={option.id}
                    className={`p-4 border rounded-lg transition-all ${
                      hasVoted ? 'bg-gray-50' : 'hover:bg-gray-50 cursor-pointer'
                    }`}
                    onClick={!hasVoted ? () => handleOptionToggle(option.id) : undefined}
                  >
                    <div className="flex items-start gap-3">
                      {!hasVoted && (
                        <Checkbox
                          checked={selectedOptions.includes(option.id)}
                          onCheckedChange={() => handleOptionToggle(option.id)}
                          className="mt-1"
                        />
                      )}
                      <div className="flex-1">
                        <p className="font-medium">{option.option_text}</p>
                        {hasVoted && (
                          <div className="mt-2">
                            <div className="flex justify-between text-sm text-gray-600 mb-1">
                              <span>{option.vote_count} votes</span>
                              <span>{percentage}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full transition-all"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="flex items-center justify-between text-sm text-gray-600 pt-4 border-t">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{totalVotes} total votes</span>
              </div>
              <div className="flex items-center gap-1">
                <BarChart3 className="h-4 w-4" />
                <span>{poll.poll_type === 'single' ? 'Single choice' : 'Multiple choice'}</span>
              </div>
            </div>

            {!hasVoted && (
              <Button
                onClick={handleSubmitVote}
                disabled={submitting || selectedOptions.length === 0}
                className="w-full"
                size="lg"
              >
                {submitting ? 'Submitting...' : 'Submit Vote'}
              </Button>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
