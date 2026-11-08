package com.projettest.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

@Service
public class JwtService {

	private static final String TOKEN_TYPE_CLAIM = "tokenType";
	private static final String ACCESS_TOKEN_TYPE = "access";
	private static final String REFRESH_TOKEN_TYPE = "refresh";

	@Value("${app.jwt.secret}")
	private String jwtSecret;

	@Value("${app.jwt.expiration}")
	private long jwtExpiration;

	@Value("${app.jwt.refresh-expiration:604800000}")
	private long refreshJwtExpiration;

	@Value("${app.jwt.n8n-expiration:31536000000}")
	private long n8nExpiration;

	public String extractUsername(String token) {
		return extractClaim(token, Claims::getSubject);
	}

	public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
		final Claims claims = extractAllClaims(token);
		return claimsResolver.apply(claims);
	}

	public String generateToken(UserDetails userDetails) {
		return generateAccessToken(userDetails);
	}

	public String generateAccessToken(UserDetails userDetails) {
		Map<String, Object> claims = new HashMap<>();
		claims.put(TOKEN_TYPE_CLAIM, ACCESS_TOKEN_TYPE);
		return generateToken(claims, userDetails, jwtExpiration);
	}

	public String generateRefreshToken(UserDetails userDetails) {
		Map<String, Object> claims = new HashMap<>();
		claims.put(TOKEN_TYPE_CLAIM, REFRESH_TOKEN_TYPE);
		return generateToken(claims, userDetails, refreshJwtExpiration);
	}

	public String generateToken(Map<String, Object> extraClaims, UserDetails userDetails) {
		return generateToken(extraClaims, userDetails, jwtExpiration);
	}

	private String generateToken(Map<String, Object> extraClaims, UserDetails userDetails, long expiration) {
		long now = System.currentTimeMillis();
		return Jwts.builder()
			.claims(extraClaims)
			.subject(userDetails.getUsername())
			.issuedAt(new Date(now))
			.expiration(new Date(now + expiration))
			.signWith(getSignInKey())
			.compact();
	}
	public String generateN8nToken(String username) {
		long now = System.currentTimeMillis();
		Map<String, Object> claims = new HashMap<>();
		claims.put(TOKEN_TYPE_CLAIM, "n8n");
		return Jwts.builder()
			.claims(claims)
			.subject(username)
			.issuedAt(new Date(now))
			.expiration(new Date(now + n8nExpiration))
			.signWith(getSignInKey())
			.compact();
    }

	public boolean isTokenValid(String token, UserDetails userDetails) {
		final String username = extractUsername(token);
		return username.equals(userDetails.getUsername())
			&& !isTokenExpired(token)
			&& ACCESS_TOKEN_TYPE.equals(extractTokenType(token));
	}

	public boolean isRefreshTokenValid(String token, UserDetails userDetails) {
		final String username = extractUsername(token);
		return username.equals(userDetails.getUsername())
			&& !isTokenExpired(token)
			&& REFRESH_TOKEN_TYPE.equals(extractTokenType(token));
	}

	public String extractTokenType(String token) {
		return extractClaim(token, claims -> claims.get(TOKEN_TYPE_CLAIM, String.class));
	}

	private boolean isTokenExpired(String token) {
		return extractExpiration(token).before(new Date());
	}

	private Date extractExpiration(String token) {
		return extractClaim(token, Claims::getExpiration);
	}

	private Claims extractAllClaims(String token) {
		return Jwts.parser()
			.verifyWith(getSignInKey())
			.build()
			.parseSignedClaims(token)
			.getPayload();
	}

	private SecretKey getSignInKey() {
		byte[] keyBytes = jwtSecret.getBytes(StandardCharsets.UTF_8);
		return Keys.hmacShaKeyFor(keyBytes);
	}
}
