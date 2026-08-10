'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { BarChart3, Users, Eye } from 'lucide-react'

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
  vote_count?: number
}

export default function PollsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [polls, setPolls] = useState<Poll[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function fetchPolls() {
    try {
      const { data, error } = await supabase
        .from('polls')
        .select(`
          *,
          votes(count)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) throw error

      const pollsWithVoteCount = data?.map((poll: any) => ({
        ...poll,
        vote_count: poll.votes?.[0]?.count || 0,
      })) || []

      setPolls(pollsWithVoteCount)
    } catch (error: any) {
      setError(error.message || 'Failed to fetch polls')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPolls()
  }, [])

  const handleVote = (pollId: string) => {
    if (!user) {
      router.push('/login')
      return
    }
    router.push(`/polls/${pollId}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading polls...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">All Polls</h1>
          <p className="text-gray-600">Browse and vote on active polls</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {polls.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-600">No active polls available</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {polls.map((poll) => (
              <Card key={poll.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{poll.title}</CardTitle>
                    <Badge variant={poll.poll_type === 'single' ? 'default' : 'secondary'}>
                      {poll.poll_type === 'single' ? 'Single' : 'Multiple'}
                    </Badge>
                  </div>
                  {poll.description && (
                    <CardDescription>{poll.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  {poll.file_url && (
                    <div className="mb-4">
                      {poll.file_type === 'image' ? (
                        <img
                          src={poll.file_url}
                          alt="Poll attachment"
                          className="w-full h-48 object-cover rounded-md"
                        />
                      ) : (
                        <a
                          href={poll.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm"
                        >
                          View attached file
                        </a>
                      )}
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{poll.vote_count} votes</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <BarChart3 className="h-4 w-4" />
                      <span>{poll.poll_type === 'single' ? 'Single choice' : 'Multiple choice'}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleVote(poll.id)}
                      className="flex-1"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Vote Now
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
