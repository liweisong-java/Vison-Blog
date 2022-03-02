package com.weisong.backend.config;

import javax.servlet.*;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
 
public class CrosFilter implements javax.servlet.Filter {
    @Override
    public void init(FilterConfig filterConfig) throws ServletException {
 
    }
 
    @Override
    public void doFilter(ServletRequest servletRequest, ServletResponse servletResponse, FilterChain filterChain) throws IOException, ServletException {
        HttpServletResponse res = (HttpServletResponse) servletResponse;
        //*号表示对所有请求都允许跨域访问
        res.addHeader("Access-Control-Allow-Origin", "*");
        res.addHeader("Access-Control-Allow-Methods", "*");
        res.addHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept,authorization");
        filterChain.doFilter(servletRequest, servletResponse);
    }

    @Override
    public void destroy() {
 
    }

}