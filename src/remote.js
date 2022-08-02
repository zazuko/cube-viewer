
export function loading () {
  return { isLoading: true, data: null, error: null }
}

export function loaded (data) {
  return { isLoading: false, data: data, error: null }
}

export function error (error) {
  return { isLoading: false, data: null, error: error }
}

export async function fetch (callback) {
  try {
    const result = await callback()
    return loaded(result)
  } catch (e) {
    // console.log(e)
    return error(e)
  }
}
