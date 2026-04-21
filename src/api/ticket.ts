import request from '@/utils/axios'
import type {
  TicketDTO,
  CreateTicketRequest,
  TicketQueryRequest,
  CommentDTO,
  AddCommentRequest,
  TicketStatsDTO,
  PageResult,
  ChatMessage,
  SendChatRequest,
  CompleteTicketRequest,
  ApproveTicketRequest
} from '@/types'

export const ticketApi = {
  createTicket(data: CreateTicketRequest) {
    return request.post<any, TicketDTO>('/v1/tickets', data)
  },

  getTicket(id: number) {
    return request.get<any, TicketDTO>(`/v1/tickets/${id}`)
  },

  listTickets(params: TicketQueryRequest) {
    return request.get<any, PageResult<TicketDTO>>('/v1/tickets', { params })
  },

  getStats(excludeCreatorId?: number) {
    const params = excludeCreatorId ? { excludeCreatorId } : {}
    return request.get<any, TicketStatsDTO>('/v1/tickets/stats', { params })
  },

  updateTicket(id: number, data: Partial<CreateTicketRequest>) {
    return request.put<any, TicketDTO>(`/v1/tickets/${id}`, data)
  },

  deleteTicket(id: number) {
    return request.delete<any, void>(`/v1/tickets/${id}`)
  },

  acceptTicket(id: number) {
    return request.post<any, TicketDTO>(`/v1/tickets/${id}/accept`)
  },

  completeTicket(id: number, data: CompleteTicketRequest) {
    return request.post<any, TicketDTO>(`/v1/tickets/${id}/complete`, data)
  },

  approveTicket(id: number, data: ApproveTicketRequest) {
    return request.post<any, TicketDTO>(`/v1/tickets/${id}/approve`, data)
  },

  close(id: number) {
    return request.put<any, TicketDTO>(`/v1/tickets/${id}/close`)
  },

  addComment(id: number, data: AddCommentRequest) {
    return request.post<any, CommentDTO>(`/v1/tickets/${id}/comment`, data)
  },

  getComments(id: number) {
    return request.get<any, CommentDTO[]>(`/v1/tickets/${id}/comments`)
  },

  getChatMessages(id: number) {
    return request.get<any, ChatMessage[]>(`/v1/tickets/${id}/chat`)
  },

  sendChatMessage(id: number, data: SendChatRequest) {
    return request.post<any, ChatMessage>(`/v1/tickets/${id}/chat`, data)
  }
}