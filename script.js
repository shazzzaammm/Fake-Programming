const txt = document.querySelector(".code");
let currLine = [];
let lineIndex = 0;
let letterIndex = 0;
document.addEventListener("keydown", (e) => {
  currLine = lineArray[lineIndex].split("");
  if (currLine[letterIndex] != undefined) {
    txt.innerText += `${currLine[letterIndex]}${
      currLine[letterIndex + 1] != undefined ? currLine[letterIndex + 1] : ""
    }`;
  } else {
    txt.innerText += "\n";
  }
  letterIndex += 2;
  if (lineIndex > lineArray.length - 1) {
    lineIndex = 0;
  }
  if (letterIndex > currLine.length - 1) {
    lineIndex++;
    letterIndex = 0;
    txt.innerText += `\n`;
  }

  document.getElementById("bottom").scrollIntoView();
});

const programs = `using System;
using System.Collections;
using UnityEngine;

public class PlayerMovement : MonoBehaviour
{
    [Header("Speed")]
    [SerializeField]
    private float moveSpeed;
    [SerializeField]
    private float maxSpeed;
    [Header("Jump")]
    [SerializeField]
    private float jumpForce;
    [SerializeField]
    private float jumpForceOverTime;
    [SerializeField]
    private float jumpTime;
    [SerializeField]
    private float gravityForce;
    [SerializeField]
    private float cayoteTime;
    [Header("Ledge Detection")]
    [SerializeField]
    private Vector3 ledgeDetectionStartPoint;
    [SerializeField]
    private Vector3 ledgeDetectionSize;
    [SerializeField]
    private Vector3 notLedgeStartPoint;
    [SerializeField]
    private Vector3 notLedgeSize;
    [SerializeField]
    private float bumpAmount;
    [Header("Prevent Wall Clinging")]
    [SerializeField]
    private PhysicsMaterial2D regularMaterial;
    [SerializeField]
    private PhysicsMaterial2D wallClingingMaterial;
    [Header("Layers")]
    [SerializeField]
    private LayerMask ground;
    [Header("Keys")]
    [SerializeField]
    private KeyCode upButton1;
    [SerializeField]
    private KeyCode upButton2;

    public event EventHandler OnPlayerLand;
    public event EventHandler OnPlayerJump;
    public event EventHandler OnPlayerLeaveGround;

    private Rigidbody2D rb;
    private Collider2D col;
    private bool jumping = false, wasGrounded = true;
    private float horizontalInput, previousHorizontalInput, forceMultiplier = 105.69f;
    private Coroutine cayoteTimeCoroutine;
    void Start()
    {
        rb = GetComponent<Rigidbody2D>();
        col = GetComponent<Collider2D>();
    }

    void Update()
    {
        //movement
        horizontalInput = Input.GetAxisRaw("Horizontal");
        if (horizontalInput != 0)
        {
            Movement();
        }

        //clamp horizontal velocity
        if (Mathf.Abs(rb.velocity.x) > maxSpeed)
        {
            rb.velocity = new Vector2(Mathf.Clamp(rb.velocity.x, -maxSpeed, maxSpeed), rb.velocity.y);
        }

        //changing directions
        if (previousHorizontalInput != horizontalInput)
        {
            rb.AddForce((rb.velocity - new Vector2(0, rb.velocity.y)) * -.5f, ForceMode2D.Impulse);
        }

        //move from rest
        if (rb.velocity.x == 0 && horizontalInput != 0)
        {
            rb.AddForce(new Vector2(horizontalInput, 0) * moveSpeed * .4f, ForceMode2D.Impulse);
        }

        //jump
        if ((Input.GetKey(upButton1) || Input.GetKey(upButton2)) && CanJump())
        {
            OnPlayerJump?.Invoke(this, EventArgs.Empty);

            rb.velocity = new Vector2(rb.velocity.x, 0);
            rb.AddForce(Vector2.up * jumpForce, ForceMode2D.Impulse);
            StartCoroutine(JumpTimer());
        }

        if ((Input.GetKey(upButton1) || Input.GetKey(upButton2)) && jumping)
        {
            rb.AddForce(Vector2.up * jumpForceOverTime * Time.deltaTime * forceMultiplier, ForceMode2D.Force);
        }

        //gravity
        rb.AddForce(Vector2.down * gravityForce * Time.deltaTime * forceMultiplier, ForceMode2D.Force);

        //cayote time
        if (IsGrounded() == false && wasGrounded == true && !jumping)
        {
            cayoteTimeCoroutine = StartCoroutine(CayoteTimer());
        }

        //ledge assits
        if (LedgeDetected() && horizontalInput != 0)
        {
            transform.position += new Vector3(0, ledgeDetectionSize.y + bumpAmount, 0);
        }

        //prevent wall clinging
        if (WallDetected() && !LedgeDetected())
        {
            col.sharedMaterial = wallClingingMaterial;
        }
        else
        {
            col.sharedMaterial = regularMaterial;
        }

        //landing effects
        if (IsGrounded() == true && wasGrounded == false)
        {
            OnPlayerLand?.Invoke(this, EventArgs.Empty);
        }
        else if (IsGrounded() == false && wasGrounded == true)
        {
            OnPlayerLeaveGround?.Invoke(this, EventArgs.Empty);
        }
        wasGrounded = IsGrounded();
        previousHorizontalInput = horizontalInput;
    }

    private void Movement()
    {
        rb.AddForce(Vector2.right * moveSpeed * horizontalInput * Time.deltaTime * forceMultiplier, ForceMode2D.Force);
    }

    private IEnumerator JumpTimer()
    {
        jumping = true;
        yield return new WaitForSeconds(jumpTime);
        jumping = false;
    }
    public bool IsGrounded()
    {
        RaycastHit2D hit = Physics2D.BoxCast(transform.position - new Vector3(0, .555f, 0), new Vector2(0.58f, .1f), 0f, Vector2.zero, 0, ground);
        if (hit != false)
        {
            if (hit.collider != null)
            {
                return true;
            }
            else
            {
                return false;
            }
        }
        else
        {
            return false;
        }
    }

    private IEnumerator CayoteTimer()
    {
        yield return new WaitForSeconds(cayoteTime);
        cayoteTimeCoroutine = null;
    }

    private bool CanJump()
    {
        if ((IsGrounded() || cayoteTimeCoroutine != null) && !jumping)
        {
            return true;
        }
        else
        {
            return false;
        }
    }

    public Vector2 GetMovementVector()
    {
        return rb.velocity.normalized;
    }

    public Vector2 GetInputDirection()
    {
        return new Vector2(Input.GetAxisRaw("Horizontal"), Input.GetAxisRaw("Vertical"));
    }

    private bool LedgeDetected()
    {
        if (WallDetected())
        {
            return false;
        }

        RaycastHit2D hitRight = Physics2D.BoxCast(transform.position + ledgeDetectionStartPoint, ledgeDetectionSize, 0f, Vector2.zero, 0, ground);
        RaycastHit2D hitLeft = Physics2D.BoxCast(transform.position - new Vector3(ledgeDetectionStartPoint.x, -ledgeDetectionStartPoint.y, ledgeDetectionStartPoint.z), ledgeDetectionSize, 0f, Vector2.zero, 0, ground);
        if (hitRight != false)
        {
            if (hitRight.collider != null)
            {
                return true;
            }
            else
            {
                return false;
            }
        }
        if (hitLeft != false)
        {
            if (hitLeft.collider != null)
            {
                return true;
            }
            else
            {
                return false;
            }
        }

        else
        {
            return false;
        }
    }

    private bool WallDetected()
    {
        RaycastHit2D hitRight = Physics2D.BoxCast(transform.position + notLedgeStartPoint, notLedgeSize, 0f, Vector2.zero, 0, ground);
        RaycastHit2D hitLeft = Physics2D.BoxCast(transform.position - new Vector3(notLedgeStartPoint.x, -notLedgeStartPoint.y, notLedgeStartPoint.z), notLedgeSize, 0f, Vector2.zero, 0, ground);

        if (hitRight.collider != false)
        {
            if (hitRight.collider != null)
            {
                return true;
            }
        }

        if (hitLeft.collider != false)
        {
            if (hitLeft.collider != null)
            {
                return true;
            }
        }
        return false;
    }
    private void OnDrawGizmosSelected()
    {
        Gizmos.color = new Color(0, 255, 0);
        Gizmos.DrawWireCube(transform.position + ledgeDetectionStartPoint, ledgeDetectionSize);
        Gizmos.DrawWireCube(transform.position - new Vector3(ledgeDetectionStartPoint.x, -ledgeDetectionStartPoint.y, ledgeDetectionStartPoint.z), ledgeDetectionSize);
        Gizmos.color = new Color(255, 0, 0);
        Gizmos.DrawWireCube(transform.position + notLedgeStartPoint, notLedgeSize);
        Gizmos.DrawWireCube(transform.position - new Vector3(notLedgeStartPoint.x, -notLedgeStartPoint.y, notLedgeStartPoint.z), notLedgeSize);
    }
}
using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class PlayerDeath : MonoBehaviour
{
    private Transform player;
    public LayerMask deathLayer;
    public KeyCode deathButton = KeyCode.R;
    public Vector2 spawnPoint;

    public event EventHandler OnPlayerDeath;
    
    private void Awake()
    {
        player = this.transform;
    }
    
    private void Update()
    {
        if (Input.GetKeyDown(deathButton))
        {
            Die();
        }

        RaycastHit2D hit = Physics2D.BoxCast(transform.position, new Vector2(1.25f, 1.25f), 0f, Vector2.zero,0,deathLayer);
        if(hit.collider!=null)
        {
            Die();
        }
    }

    public void Die()
    {
        OnPlayerDeath?.Invoke(this, EventArgs.Empty);

        player.gameObject.GetComponent<Rigidbody2D>().velocity = Vector2.zero;
        player.position = spawnPoint;
    }

    private void OnDrawGizmosSelected()
    {
        Gizmos.color = new Color(0, 0, 255);
        Gizmos.DrawWireCube(spawnPoint, new Vector3(1, 1, 1));
    }
}

using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class PlayerGrapple : MonoBehaviour
{
    public float grappleSpeed,springFrequency,grappleDetectionRadius,grappleMaxDistance,grappleMinDistance;
    
    private Vector2 grapplePoint, mousePosition;
    
    public KeyCode grappleKey = KeyCode.Mouse0;
    public KeyCode grappleLengthenKey = KeyCode.S;
    public KeyCode grappleShortenKey = KeyCode.Space;
    
    public LayerMask grappleAble;
    
    private SpringJoint2D spring;
    private Rigidbody2D rb;
    private Collider2D col;
    private bool isGrappling;
    private LineRenderer lr;
    private PlayerDeath pd;

    public event EventHandler OnStartGrapple;
    public event EventHandler OnEndGrapple;
    
    void Start()
    {
        rb = GetComponent<Rigidbody2D>();
        lr = GetComponent<LineRenderer>();
        col = GetComponent<Collider2D>();
        pd = GetComponent<PlayerDeath>();
        lr.enabled = false;
        lr.positionCount = 2;

        pd.OnPlayerDeath += Pd_OnPlayerDeath;
    }


    void Update()
    {
        
        if(Input.GetKeyDown(grappleKey)&&CheckForGrapplePoints())
        {
            StartGrapple();
        }
        else if(Input.GetKeyUp(grappleKey))
        {
            EndGrapple();
        }

        if(isGrappling)
        {
            GrappleMovement();
        }
    }


    private void StartGrapple()
    {
        OnStartGrapple?.Invoke(this,EventArgs.Empty);
        isGrappling = true;
        
        spring = gameObject.AddComponent<SpringJoint2D>();
        spring.connectedAnchor = grapplePoint;
        spring.autoConfigureDistance = true;
        spring.distance = Vector2.Distance(transform.position, grapplePoint);
        spring.frequency = springFrequency;
        spring.enableCollision = true;


        lr.enabled = true;
    }
    private void EndGrapple()
    {
        isGrappling = false;
        Destroy(spring);
        lr.enabled = false;
        OnEndGrapple?.Invoke(this,EventArgs.Empty);
    }

    private void GrappleMovement()
    {
        lr.SetPosition(0, transform.position);
        lr.SetPosition(1, grapplePoint);

        if(Input.GetKey(grappleShortenKey))
        {
            ShortenGrapple();
        }
        if(Input.GetKey(grappleLengthenKey))
        {
            LengthenGrapple();
        }
        spring.distance = Mathf.Clamp(spring.distance, grappleMinDistance, grappleMaxDistance);
    }
    private void Pd_OnPlayerDeath(object sender, EventArgs e)
    {
        EndGrapple();
    }

    private void ShortenGrapple()
    {
        spring.distance -= grappleSpeed * Time.deltaTime;
    }

    private void LengthenGrapple()
    {
        spring.distance += grappleSpeed * Time.deltaTime;
    }

    private bool CheckForGrapplePoints()
    {
        var screenPos = Input.mousePosition;
        mousePosition = Camera.main.ScreenToWorldPoint(screenPos);

        RaycastHit2D hit = Physics2D.CircleCast(transform.position, grappleDetectionRadius, Vector2.zero,0,grappleAble);
        if(hit!=false)
        {
            if(Mathf.Abs(Vector2.Distance(hit.collider.transform.position, transform.position)) < grappleMaxDistance)
            {
                Transform trans = hit.collider.transform;
                grapplePoint = new Vector2(trans.position.x,trans.position.y);
                return true;
            }
            else
            { 
                return false;
            }
        }
        else
        {
            return false;
        }
    }

    private void OnDrawGizmos()
    {
        // Gizmos.DrawWireSphere(mousePosition, grappleDetectionRadius);
    }
}

using DG.Tweening;
using UnityEngine;
[RequireComponent(typeof(AudioSource))]
[RequireComponent(typeof(PlayerMovement))]
[RequireComponent(typeof(PlayerGrapple))]
[RequireComponent(typeof(PlayerDeath))]
public class PlayerFX : MonoBehaviour
{
    private PlayerMovement pm;
    private PlayerGrapple pg;
    private PlayerDeath pd;
    private AudioSource audioSource;

    private LineRenderer lr;

    [Header("Landing Effects")]
    [SerializeField]
    private ParticleSystem landingSystem;
    [SerializeField]
    private AudioClip landingSound;
    [SerializeField]
    private float landingScreenShakeAmplitude;
    [SerializeField]
    private float landingSquash;
    [SerializeField]
    private float landingStretch;

    [Header("Jumping Effects")]
    [SerializeField]
    private ParticleSystem jumpingSystem;
    [SerializeField]
    private AudioClip jumpingSound;
    [SerializeField]
    private float jumpingScreenShakeAmplitude;
    [SerializeField]
    private float jumpingSquash;
    [SerializeField]
    private float jumpingStretch;

    [Header("Death Effects")]
    [SerializeField]
    private ParticleSystem deathSystem;
    [SerializeField]
    private AudioClip deathSound;
    [SerializeField]
    private float deathScreenShakeAmplitude;

    [Header("RunningEffects")]
    [SerializeField]
    private ParticleSystem runningSystem;

    [Header("Squash and Stretch")]
    [SerializeField]
    private Transform heightObject;
    private float originalHeight;
    private float origialWidth;
    void Start()
    {
        //get components
        pm = GetComponent<PlayerMovement>();
        pg = GetComponent<PlayerGrapple>();
        pd = GetComponent<PlayerDeath>();
        audioSource = GetComponent<AudioSource>();
        lr=GetComponent<LineRenderer>();

        //sub to events
        pm.OnPlayerJump += SpawnPlayerJumpEffects;
        pm.OnPlayerLand += SpawnPlayerLandEffects;
        pm.OnPlayerLeaveGround += SpawnPlayerLeaveGroundEffects;
        pd.OnPlayerDeath += SpawnPlayerDeathEffects;
        pg.OnStartGrapple += SpawnGrappleEffects;
        pg.OnEndGrapple += DeSpawnGrappleEffects;

        //assign variable values
        originalHeight = heightObject.localScale.y;
        origialWidth = heightObject.localScale.x;
     }
     private void DeSpawnGrappleEffects(object sender, System.EventArgs e)
     {

     }

    private void SpawnGrappleEffects(object sender, System.EventArgs e)
    {

    }

    private void SpawnPlayerDeathEffects(object sender, System.EventArgs e)
    {

        Instantiate(deathSystem, transform.position, Quaternion.identity);
        CameraController.instance.ShakeCamera(deathScreenShakeAmplitude, .1f);
    }

    private void SpawnPlayerLeaveGroundEffects(object sender, System.EventArgs e)
    {
 
        if (runningSystem.gameObject.activeSelf)
        {
            runningSystem.gameObject.SetActive(false);
        }
    }

    private void SpawnPlayerLandEffects(object sender, System.EventArgs e)
    {
        Instantiate(landingSystem, transform.position - new Vector3(0, .15f, 0), Quaternion.identity);
        CameraController.instance.ShakeCamera(landingScreenShakeAmplitude, .1f);
        if (!runningSystem.gameObject.activeSelf)
        {
            runningSystem.gameObject.SetActive(true);
        }
        SquashAndStretch(landingSquash,landingStretch,.1f);
    }

    private void SpawnPlayerJumpEffects(object sender, System.EventArgs e)
    {

        Instantiate(jumpingSystem, transform.position - new Vector3(0, .15f, 0), Quaternion.identity);
        CameraController.instance.ShakeCamera(jumpingScreenShakeAmplitude, .1f);

        SquashAndStretch(jumpingSquash,jumpingStretch,.1f);
    }

    private void SquashAndStretch(float squash,float stretch,float duration)
    {
        heightObject.DOScale(new Vector3(origialWidth,originalHeight,1),0f);
        
        heightObject.DOScaleX(squash,duration).SetLoops(2,LoopType.Yoyo);
        heightObject.DOScaleY(stretch,duration).SetLoops(2,LoopType.Yoyo);
    }
}

using UnityEngine;

public class PlayerStatTracker : MonoBehaviour
{
    private PlayerMovement pm;
    private PlayerDeath pd;
    private PlayerGrapple pg;
    private Stats stats;

    private void Start() {
        //get components
        pm=GetComponent<PlayerMovement>();
        pd=GetComponent<PlayerDeath>();
        pg=GetComponent<PlayerGrapple>();
        
        //sub to events
        pm.OnPlayerJump += incrementJumpCount;
        pd.OnPlayerDeath += incrementDeathCount;
        pg.OnStartGrapple += incrementGrappleCount;

        //
        stats = DataManager.instance.stats;
    }
    
    private void incrementJumpCount(object sender,System.EventArgs e)
    {
        stats.jumps++;
    }
    private void incrementDeathCount(object sender,System.EventArgs e)
    {
        stats.deaths++;
    }
    private void incrementGrappleCount(object sender,System.EventArgs e)
    {
        stats.grapples++;
    }
}

using UnityEngine;
using Cinemachine;
public class CameraController : MonoBehaviour
{
    public Vector2 targetPosition { get; private set; }
    [SerializeField]
    private float moveSpeed;
    private float shakeTimer, startingIntensity, totalShakeTimer;
    
    [SerializeField]
    private Transform targetTransform;
    public static CameraController instance;
    private CinemachineVirtualCamera cam;
    [SerializeField]
    private bool followingTransform = false;
    private void Awake()
    {
        instance = this;
        cam = GetComponent<CinemachineVirtualCamera>();
    }
    public void SetTargetPosition(Vector2 newPos)
    {
        targetPosition = newPos;
        followingTransform = false;
    }
    
    public void ShakeCamera(float intensity, float time)
    {
        CinemachineBasicMultiChannelPerlin noise = cam.GetCinemachineComponent<CinemachineBasicMultiChannelPerlin>();

        noise.m_AmplitudeGain = intensity;

        shakeTimer = time;
        totalShakeTimer = time;

        startingIntensity = intensity;
    }

    private void FixedUpdate()
    {
        if(!followingTransform)
        {
            transform.position = Vector3.Lerp(transform.position, new Vector3(targetPosition.x,targetPosition.y,-10), moveSpeed * Time.deltaTime);
        }
        else
        {
            transform.position = Vector3.Lerp(transform.position,new Vector3(targetTransform.position.x,transform.position.y,-10),moveSpeed*Time.deltaTime);
        }
        
        if (shakeTimer > 0)
        {
            shakeTimer -= Time.deltaTime;

            if (shakeTimer <= 0f)
            {
                CinemachineBasicMultiChannelPerlin noise = cam.GetCinemachineComponent<CinemachineBasicMultiChannelPerlin>();

                noise.m_AmplitudeGain = Mathf.Lerp(startingIntensity, 0f, 1 - (shakeTimer / totalShakeTimer));
            }
        }
    }

    public void FollowTarget()
    {
        followingTransform = true;
    }
}

using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class PlayerAnimations : MonoBehaviour
{
    private float x,prevX;
    private float y,prevY;
    [SerializeField] private Animator anim;
    private PlayerMovement pm;
    private bool jumping=false;
    private void Start()
    {
        pm = GetComponent<PlayerMovement>();
        pm.OnPlayerJump += PlayJumpAnimation;
        pm.OnPlayerLand += PlayLandingAnimation;
    }

    private void PlayLandingAnimation(object sender, System.EventArgs e)
    {
        if(jumping)
        {
            jumping = false;
            anim.Play("Land");
        }
    }

    private void PlayJumpAnimation(object sender, System.EventArgs e)
    {
        jumping = true;
        if(x>0)
        {
            anim.Play("JumpRight");
        }
        else if(x<0)
        {
            anim.Play("JumpLeft");
        }
        else if (prevX>0)
        {
            anim.Play("JumpRight");
        }
        else
        {
            anim.Play("JumpLeft");
        }

    }

    private void Update()
    {
        x = pm.GetMovementVector().x;
        y = pm.GetMovementVector().y;

        anim.SetFloat("X",x);
        anim.SetFloat("Y",y);
        if(jumping)
        {
            return;
        }
        else if(x<0)
        {
            anim.Play("RunLeft");
            prevX = x;
        }
        else if(x>0)
        {
            anim.Play("RunRight");
            prevX = x;
        }
        else if(prevX<0)
        {
            anim.Play("IdleLeft");
        }
        else if(prevX>0)
        {
            anim.Play("IdleRight");
        }
    }


}

`;
let lineArray = programs.split("\n");
// let lineArray = program.split("");
