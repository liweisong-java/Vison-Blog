package com.weisong.backend.controller;

import com.auth0.jwt.interfaces.Header;
import com.github.pagehelper.PageHelper;
import com.github.pagehelper.PageInfo;
import com.weisong.backend.Token.UserLoginToken;
import com.weisong.backend.entities.Article;
import com.weisong.backend.entities.User;
import com.weisong.backend.service.ArticleService;
import com.weisong.backend.service.UserService;
import com.weisong.backend.util.Result.Result;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.validation.BindingResult;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;


@RestController
@RequestMapping(value = "/article")
public class ArticleController{
    Logger logger = LoggerFactory.getLogger(ArticleController.class);
    @Autowired
    ArticleService articleService;

//  查询所有文章
    @ResponseBody
    @GetMapping(value = "/list")
    public Result getArticleList(){
        logger.info("begin getArticleList");
        return Result.success(articleService.getAllArticle());
    }

//  分页查询文章
    @ResponseBody
    @GetMapping(value = "/listPage")
    public Result<Map<String, Object>> ArticlePageList(@RequestBody Map map){
        Integer pageIndex=(Integer)map.get("pageIndex");
        Integer pageSize=(Integer)map.get("pageSize");
        PageHelper.startPage(pageIndex,pageSize);
        List<Article> list = articleService.getAllArticle();
        PageInfo pageInfo=new PageInfo<>(list);
        return Result.success(Result.pageInfoToMap(pageInfo));
    }

//  添加文章
    @UserLoginToken
    @ResponseBody
    @RequestMapping(value = "/addArticle",method = RequestMethod.POST)
    public Result addArticle(@RequestBody Article article){
        // System.out.println(token);
        return Result.success(articleService.addArticle(article));
    }


//   删除文章
    @ResponseBody
    @RequestMapping(value = "/deleteArticleById",method = RequestMethod.POST)
    public Result deleteArticleById(@RequestBody String uuid){
        articleService.deleteArticleById(uuid);
        return Result.success();
    }



//    @ResponseBody
//    @RequestMapping(value = "/changeEnable",method = RequestMethod.POST)
//    public Result changeEnableById(@RequestBody User user){
//        logger.info("begin changeEnableById");
//        return Result.success(userService.changeEnableById(user.getEmp_Id()));
//    }



}
