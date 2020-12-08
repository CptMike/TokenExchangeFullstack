import React from 'react'

export default function({ type }) {
    if (type === 'table') {
        return(<tbody className="spinner-boarder text-light text-center"></tbody>)
    } else {
        return(<div className="spinner-boarder text-light text-center"></div>)
    }
}