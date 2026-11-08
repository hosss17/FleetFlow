package com.projettest.testing.config;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

/**
 * For SPA deployments, forward non-API deep links to index.html
 * so Angular router can resolve them client-side.
 */
@Controller
@RequestMapping
public class SpaForwardController {

    @GetMapping(value = {
    "/{path:^(?!api$)(?!ws$)(?!error$)[^\\.]*}",
    "/{path:^(?!api$)(?!ws$)(?!error$)[^\\.]*}/**"
})
public String forward() {
    return "forward:/index.html";
}
}                                                                                    