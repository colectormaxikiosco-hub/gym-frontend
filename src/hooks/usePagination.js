import { useState, useCallback } from "react"

/**
 * Hook reutilizable para estado de paginación.
 * Útil para listados (clientes, membresías, etc.) que usan paginación en backend.
 *
 * @param {Object} initial - Valores iniciales
 * @param {number} [initial.page=1]
 * @param {number} [initial.limit=10]
 * @param {number[]} [initial.rowsPerPageOptions=[5, 10, 25, 50]]
 * @returns {{
 *   page: number,
 *   limit: number,
 *   total: number,
 *   totalPages: number,
 *   setPage: (n: number) => void,
 *   setLimit: (n: number) => void,
 *   setPagination: (p: { page, limit, total, totalPages }) => void,
 *   rowsPerPageOptions: number[],
 *   handleChangePage: (e, newPage) => void,
 *   handleChangeRowsPerPage: (e) => void,
 * }}
 */
export function usePagination(initial = {}) {
  const [page, setPageState] = useState(initial.page ?? 1)
  const [limit, setLimitState] = useState(initial.limit ?? 10)
  const [total, setTotal] = useState(initial.total ?? 0)
  const [totalPages, setTotalPages] = useState(initial.totalPages ?? 0)

  const rowsPerPageOptions = initial.rowsPerPageOptions ?? [5, 10, 25, 50]

  const setPage = useCallback((newPage) => {
    setPageState((p) => Math.max(1, newPage))
  }, [])

  const setLimit = useCallback((newLimit) => {
    setLimitState((l) => Math.max(1, newLimit))
    setPageState(1)
  }, [])

  const setPagination = useCallback((p) => {
    if (p?.page != null) setPageState(Math.max(1, p.page))
    if (p?.limit != null) setLimitState(Math.max(1, p.limit))
    if (p?.total != null) setTotal(p.total)
    if (p?.totalPages != null) setTotalPages(p.totalPages)
  }, [])

  const handleChangePage = useCallback((_event, newPage) => {
    setPageState((p) => Math.max(1, newPage + 1))
  }, [])

  const handleChangeRowsPerPage = useCallback((event) => {
    const newLimit = parseInt(event.target.value, 10)
    setLimitState(Math.max(1, newLimit))
    setPageState(1)
  }, [])

  return {
    page,
    limit,
    total,
    totalPages,
    setPage,
    setLimit,
    setPagination,
    rowsPerPageOptions,
    handleChangePage,
    handleChangeRowsPerPage,
  }
}

export default usePagination
