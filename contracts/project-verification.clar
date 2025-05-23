;; Project Verification Contract
;; This contract validates restoration initiatives

(define-data-var admin principal tx-sender)

;; Project status enum: 0-pending, 1-approved, 2-rejected, 3-completed
(define-map projects
  { project-id: uint }
  {
    owner: principal,
    name: (string-utf8 100),
    description: (string-utf8 500),
    location: (string-utf8 100),
    status: uint,
    verification-date: uint,
    verifier: (optional principal)
  }
)

(define-data-var next-project-id uint u0)

;; Create a new project (pending verification)
(define-public (submit-project (name (string-utf8 100)) (description (string-utf8 500)) (location (string-utf8 100)))
  (let ((project-id (var-get next-project-id)))
    (begin
      (map-set projects
        { project-id: project-id }
        {
          owner: tx-sender,
          name: name,
          description: description,
          location: location,
          status: u0,
          verification-date: u0,
          verifier: none
        }
      )
      (var-set next-project-id (+ project-id u1))
      (ok project-id)
    )
  )
)

;; Verify a project (only admin can verify)
(define-public (verify-project (project-id uint) (status uint))
  (let ((project (unwrap! (map-get? projects { project-id: project-id }) (err u1))))
    (begin
      (asserts! (is-eq tx-sender (var-get admin)) (err u2))
      (asserts! (and (>= status u1) (<= status u3)) (err u3))
      (map-set projects
        { project-id: project-id }
        (merge project {
          status: status,
          verification-date: block-height,
          verifier: (some tx-sender)
        })
      )
      (ok true)
    )
  )
)

;; Get project details
(define-read-only (get-project (project-id uint))
  (map-get? projects { project-id: project-id })
)

;; Transfer admin rights
(define-public (transfer-admin (new-admin principal))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) (err u4))
    (var-set admin new-admin)
    (ok true)
  )
)
