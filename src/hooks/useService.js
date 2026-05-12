import { useState, useEffect, useCallback } from 'react'
import api from '../api/axios'

export default function useService(endpoint) {
  const [records, setRecords] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)

  const fetch = useCallback(async (p = page) => {
    setLoading(true)
    try {
      const { data } = await api.get(`/${endpoint}?page=${p}`)
      setRecords(data.data)
      setTotal(data.total)
    } finally {
      setLoading(false)
    }
  }, [endpoint, page])

  useEffect(() => { fetch(page) }, [page])

  const create = async (payload) => {
    await api.post(`/${endpoint}`, payload)
    fetch(page)
  }

  const update = async (id, payload) => {
    await api.put(`/${endpoint}/${id}`, payload)
    fetch(page)
  }

  const remove = async (id) => {
    await api.delete(`/${endpoint}/${id}`)
    fetch(page)
  }

  return { records, total, page, setPage, loading, create, update, remove, refresh: fetch }
}
