package com.weisong.backend.controller;

import com.github.pagehelper.PageHelper;
import com.github.pagehelper.PageInfo;
import com.weisong.backend.Token.UserLoginToken;
import com.weisong.backend.entities.Article;
import com.weisong.backend.service.ArticleService;
import com.weisong.backend.util.BaseUserInfo;
import com.weisong.backend.util.Result.Result;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;

import org.springframework.web.bind.annotation.*;


import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;
import java.util.Map;


@RestController
@RequestMapping(value = "/article")
public class ArticleController{
    Logger logger = LoggerFactory.getLogger(ArticleController.class);

    @Autowired
    ArticleService articleService;

//  查询所有文章
    @GetMapping(value = "/list")
    public Result getArticleList(){
        logger.info("begin getArticleList");
        return Result.success(articleService.getAllArticle());
    }

//    通过uuid查询文章
    @GetMapping(value = "/{articleUuid}")
    public Result getArticleByUuid(@PathVariable("articleUuid") String articleUuid){
        articleService.incView(articleUuid);
        return Result.success(articleService.getArticleByUuid(articleUuid));
    }

//  分页查询文章
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
    @RequestMapping(value = "/addArticle",method = RequestMethod.POST)
    public Result addArticle(@RequestBody Article article){
        article.setUserUuid(BaseUserInfo.get("userUuid"));
        article.setName(BaseUserInfo.get("name"));
        article.setArticleUuid(article.createArticleUuid());
        article.setRead(0);
        article.setLike(0);
        article.setAnswer(0);
        SimpleDateFormat a=new SimpleDateFormat("yyyy-MM-dd HH:mm");
        article.setCreateDate(a.format(new Date()));
        articleService.addArticle(article);
        return Result.success(article.getArticleUuid());
    }


//   删除文章
    @RequestMapping(value = "/deleteArticleById",method = RequestMethod.POST)
    public Result deleteArticleById(@RequestBody String articleUuid){
        articleService.deleteArticleById(articleUuid);
        return Result.success();
    }



//    @ResponseBody
//    @RequestMapping(value = "/changeEnable",method = RequestMethod.POST)
//    public Result changeEnableById(@RequestBody User user){
//        logger.info("begin changeEnableById");
//        return Result.success(userService.changeEnableById(user.getEmp_Id()));
//    }



}
